# Agency Ecommerce Core — Middleware Design

**Version:** v1.0
**File:** `src/middleware.ts`
**Depends On:** Auth Design Spec v1.0 · Error Handling Standard v1.0

---

## 0. Scope

Next.js App Router has a single `middleware.ts` at the project root. This spec defines everything that runs in that file and the supporting API-layer middleware (rate limiting, CORS).

Responsibilities:
1. **Route protection** — auth guards and role checks for page routes
2. **Rate limiting** — protect auth and mutation endpoints
3. **CORS** — handle cross-origin requests to API routes
4. **Security headers** — applied globally (see Security Checklist for full list)

---

## 1. Middleware Execution Flow

```
Incoming Request
       │
       ▼
  middleware.ts
       │
       ├─ Is it an API route? (/api/*)
       │       ├─ Apply CORS headers
       │       ├─ Apply rate limiting (auth/mutation routes)
       │       └─ Pass through (API routes handle their own auth)
       │
       └─ Is it a page route?
               ├─ Apply security headers to all pages
               ├─ Is it an auth page (/login, /register)?
               │       └─ Redirect authenticated users away
               ├─ Is it a protected page (/dashboard/*, /account/*)?
               │       ├─ No session → redirect to /login?callbackUrl=...
               │       └─ Wrong role → redirect to /
               └─ All other pages → pass through
```

---

## 2. `middleware.ts` — Complete Implementation

```ts
// src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Rate limiter instances ───────────────────────────────────────────────────

const redis = Redis.fromEnv();

// Auth endpoints: 5 requests per 15 minutes per IP
const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "ratelimit:auth",
});

// General API mutations: 60 requests per minute per IP
const apiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "ratelimit:api",
});

// ─── Route matchers ───────────────────────────────────────────────────────────

// Routes where authenticated users should be redirected away
const AUTH_PAGES = ["/login", "/register", "/forgot-password"];

// Protected routes and their minimum required roles
const ROLE_PROTECTED = [
  { pattern: "/dashboard", roles: ["ADMIN", "STAFF"] },
  { pattern: "/account",   roles: ["ADMIN", "STAFF", "CUSTOMER"] },
] as const;

// API routes that need strict rate limiting (auth operations)
const AUTH_RATE_LIMITED_ROUTES = [
  "/api/auth/callback/credentials",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/accept-invite",
];

// ─── Allowed CORS origins ─────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL ?? "",
  // Add staging URL if needed
].filter(Boolean);

// ─── Security headers (applied to all responses) ──────────────────────────────

const SECURITY_HEADERS = {
  "X-Frame-Options":           "DENY",
  "X-Content-Type-Options":    "nosniff",
  "Referrer-Policy":           "strict-origin-when-cross-origin",
  "Permissions-Policy":        "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control":    "on",
};

// ─── Main middleware ──────────────────────────────────────────────────────────

export default auth(async function middleware(req: NextRequest & { auth?: unknown }) {
  const { nextUrl, ip, method } = req;
  const pathname = nextUrl.pathname;
  const session  = (req as unknown as { auth: { user?: { id: string; role: string } } | null }).auth;

  // ── 1. Security headers on all responses ────────────────────────────────────
  const res = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // ── 2. CORS for API routes ───────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    // Pre-flight OPTIONS
    if (method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: res.headers });
    }

    // ── 3. Rate limiting (API routes only) ────────────────────────────────────
    const clientIp = ip ?? req.headers.get("x-forwarded-for") ?? "unknown";

    const isAuthRoute = AUTH_RATE_LIMITED_ROUTES.some((r) => pathname.startsWith(r));
    const limiter = isAuthRoute ? authRatelimit : apiRatelimit;

    // Only rate limit state-changing methods and auth routes
    if (isAuthRoute || ["POST", "PATCH", "DELETE"].includes(method)) {
      const { success, remaining, reset } = await limiter.limit(clientIp);

      res.headers.set("X-RateLimit-Remaining", String(remaining));
      res.headers.set("X-RateLimit-Reset", String(reset));

      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
          {
            status: 429,
            headers: {
              "Retry-After":          String(Math.ceil((reset - Date.now()) / 1000)),
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }
    }

    // API routes handle their own auth — pass through
    return res;
  }

  // ── 4. Page routes — redirect authenticated users away from auth pages ───────
  if (AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    if (session?.user) {
      const dest = session.user.role === "CUSTOMER" ? "/" : "/dashboard";
      return NextResponse.redirect(new URL(dest, nextUrl));
    }
    return res;
  }

  // ── 5. Page routes — role-based protection ───────────────────────────────────
  for (const { pattern, roles } of ROLE_PROTECTED) {
    if (pathname.startsWith(pattern)) {
      // Not authenticated → redirect to login with callback
      if (!session?.user) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Wrong role → redirect home
      if (!roles.includes(session.user.role as never)) {
        return NextResponse.redirect(new URL("/", nextUrl));
      }

      break;
    }
  }

  return res;
});

export const config = {
  // Run on all routes except static files, _next internals, and favicon
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
```

---

## 3. Rate Limiting — Upstash Redis

**Why Upstash:** Serverless-compatible Redis with a generous free tier (10,000 commands/day). Works with both Vercel Edge and Node.js runtimes. Alternative for clients without a Redis budget: use an in-memory approach (but this resets on cold starts — not reliable).

### Environment Variables

```env
# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

### Rate Limit Tiers

| Route Group | Window | Max Requests | Per |
|---|---|---|---|
| Auth endpoints (`/api/auth/*`) | 15 minutes | 5 | IP |
| API mutations (`POST/PATCH/DELETE`) | 1 minute | 60 | IP |
| Public `GET` routes | Not rate limited | — | — |
| Webhook routes (`/api/webhooks/*`) | Not IP rate limited | — | — (signature-verified instead) |

> **Webhook routes are excluded from IP rate limiting.** Payment gateways call webhooks from their own server IPs, which would hit rate limits. Signature verification (in the route handler) is the security mechanism for webhooks.

### Per-Client Tuning

Stricter limits for high-risk routes can be added to `store.config.ts`:

```ts
rateLimits: {
  authWindowMinutes:   15,
  authMaxRequests:     5,
  apiWindowSeconds:    60,
  apiMaxRequests:      60,
}
```

---

## 4. CORS Policy

**Default policy:** Same-origin only — CORS is only allowed from `NEXT_PUBLIC_SITE_URL`. This covers the standard case where the storefront and API are on the same domain.

**If a client needs a headless setup** (separate storefront domain):
- Add the storefront domain to `ALLOWED_ORIGINS` via env var
- Do not hardcode additional origins in middleware

**Public API endpoints** (`GET /api/products`, `GET /api/shipping/rates`, etc.) are intentionally open — they can be called from any origin. Only mutation and authenticated endpoints need strict CORS enforcement. However, enforcing CORS universally at the middleware level is simpler than per-route logic.

---

## 5. Content Security Policy

CSP is handled separately from the middleware's security headers because it requires store-specific configuration (e.g., Cloudinary image sources, payment gateway scripts).

Add CSP via `next.config.js` headers:

```js
// next.config.js

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://res.cloudinary.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.stripe.com https://checkout.stripe.com;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`;

module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key:   "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
};
```

**Client customisation:** Add payment provider script sources to CSP per-client (e.g., `bkash.com` URLs for bKash SDK).

---

## 6. API-Level Auth (Separate from Middleware)

Middleware handles **page-level** auth. API routes handle their own auth using the helpers from the Auth Spec. This is intentional — API routes need method-level granularity (e.g., `GET /api/orders` is customer-scoped, `PATCH /api/orders/[id]` is staff-only).

The standard API route pattern combining all middleware concerns:

```ts
// Pattern for a protected API route

import { withHandler } from "@/core/errors/with-handler";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { parseBody } from "@/core/api/validate";
import { CreateCouponRequestSchema } from "@/core/api/schemas/coupons";

export const GET = withHandler(async (req) => {
  await requireDashboardAccess();                        // Auth
  // ... fetch and return
});

export const POST = withHandler(async (req) => {         // Error handling wrapper
  await requireDashboardAccess();                        // Auth
  const body = await req.json();
  const parsed = parseBody(CreateCouponRequestSchema, body);  // Validation
  if ("error" in parsed) return parsed.error;
  // ... create and return
});
```

---

## 7. Middleware Runtime

```ts
// If using Edge runtime (recommended for performance):
export const runtime = "edge";

// Exception: If using Upstash Redis with the HTTP SDK, Edge works fine.
// If using any Node.js-only package in middleware, switch to:
export const runtime = "nodejs";
```

**Recommendation:** Keep middleware on Edge runtime — it runs closest to the user and has the lowest cold start latency. The Upstash Redis HTTP client is Edge-compatible.

---

## 8. Testing Middleware

| Scenario | Expected |
|---|---|
| Unauthenticated user → `/dashboard` | Redirect to `/login?callbackUrl=/dashboard` |
| CUSTOMER role → `/dashboard` | Redirect to `/` |
| STAFF role → `/dashboard` | Pass through |
| ADMIN role → `/dashboard` | Pass through |
| Authenticated user → `/login` | Redirect to `/dashboard` |
| Authenticated CUSTOMER → `/login` | Redirect to `/` |
| > 5 login attempts in 15 min | 429 response with `Retry-After` header |
| OPTIONS preflight → `/api/products` | 204 with CORS headers |
| Request from unknown origin → `/api/checkout` | No CORS headers (same-origin request proceeds normally) |
| Webhook POST → `/api/webhooks/*` | Not rate limited — passes through |
