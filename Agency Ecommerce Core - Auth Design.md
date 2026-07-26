# Agency Ecommerce Core — Auth Design Spec

**Version:** v1.0 (Auth)
**Parent Document:** Architecture Plan v1.0
**Library:** Auth.js v5 (NextAuth v5) — App Router native
**Stack:** Auth.js · bcrypt · Zod · JWT · Next.js Middleware

---

## 0. How to read this document

The Architecture doc established: "Use `next-auth` with a credentials + optional Google provider, session strategy JWT, role stored on the session token." This document specifies every implementation decision a developer needs to write code without asking questions.

This is **Core-owned**. No client project should ever modify auth logic. Per-client auth behavior (e.g. enabling/disabling Google login, guest checkout, customer registration) is controlled entirely through `store.config.ts`.

---

## 1. User Roles & Permissions

Three roles, as defined in the Prisma schema:

```
ADMIN    → Full access. Can manage everything including staff accounts.
STAFF    → Dashboard access. Can manage products, orders, customers, inventory, coupons, shipping, reviews, media.
CUSTOMER → Storefront access. Can view own orders, manage own addresses, write reviews.
```

### Permission Matrix

| Action | ADMIN | STAFF | CUSTOMER | Guest |
|---|:---:|:---:|:---:|:---:|
| Dashboard access | ✅ | ✅ | ❌ | ❌ |
| Manage products / categories / brands | ✅ | ✅ | ❌ | ❌ |
| Manage orders (status, refunds) | ✅ | ✅ | ❌ | ❌ |
| View customers | ✅ | ✅ | ❌ | ❌ |
| Manage coupons / shipping / reviews | ✅ | ✅ | ❌ | ❌ |
| Manage media library | ✅ | ✅ | ❌ | ❌ |
| Manage store settings | ✅ | ❌ | ❌ | ❌ |
| Manage team (invite/remove staff) | ✅ | ❌ | ❌ | ❌ |
| Manage payment provider settings | ✅ | ❌ | ❌ | ❌ |
| View own orders | ✅ | ✅ | ✅ | ❌ |
| Manage own addresses | ✅ | ✅ | ✅ | ❌ |
| Write reviews | ✅ | ✅ | ✅ | ❌ |
| Browse products | ✅ | ✅ | ✅ | ✅ |
| Add to cart | ✅ | ✅ | ✅ | ✅ |
| Checkout | ✅ | ✅ | ✅ | ✅ (if enabled) |

### Key decisions

- **STAFF cannot manage settings or team.** This prevents a store manager from accidentally breaking payment config or elevating their own privileges.
- **STAFF and ADMIN share all other dashboard permissions.** V1 does not need granular per-feature permissions (e.g. "can manage orders but not products"). If this becomes a recurring client request, it's a V2 Core feature — not a per-client patch.
- **Guests can checkout only if `storeConfig.guestCheckoutEnabled === true`.** Otherwise, the checkout flow redirects to login/register.

---

## 2. Schema Additions

The existing `User` model from the Architecture doc is almost complete. Two additions needed:

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String?
  role            Role      @default(CUSTOMER)
  name            String?
  phone           String?
  emailVerified   Boolean   @default(false)     // NEW — tracks email verification status
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt           // NEW — tracks profile changes
  orders          Order[]
  addresses       Address[]
  reviews         Review[]                       // NEW — relation back from Review model
}

model PasswordResetToken {                       // NEW — entire model
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
}

model StaffInvite {                              // NEW — entire model
  id        String   @id @default(cuid())
  email     String
  role      Role     @default(STAFF)
  token     String   @unique
  invitedBy String                               // userId of the ADMIN who created the invite
  expiresAt DateTime
  acceptedAt DateTime?
  createdAt DateTime @default(now())
}
```

### Why these additions

- **`emailVerified`**: Needed for password reset (don't send reset to unverified emails) and for optional email verification flow if a client wants it. Defaults to `false`; set to `true` on first email confirmation or on Google OAuth login.
- **`updatedAt`**: Standard audit field, missing from original schema.
- **`PasswordResetToken`**: Separate model (not a column on User) because tokens are short-lived, one-time-use, and need their own expiry and audit trail. Using `usedAt` instead of deletion allows detecting reuse attempts.
- **`StaffInvite`**: ADMIN invites staff by email. The invite creates a record with a unique token. The staff member clicks the link, sets a password, and their User is created with `role: STAFF`. This avoids ADMIN having to set passwords for staff or share credentials.

---

## 3. Auth.js v5 Configuration

### File: `src/lib/auth.ts`

```ts
// src/lib/auth.ts — Auth.js v5 configuration

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { storeConfig } from "@/config/store.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",              // storefront login page (client-owned UI, Core-owned route config)
    error: "/login",               // redirect to login on auth error
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    // Google provider conditionally included based on store config
    ...(storeConfig.auth.googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign-in, attach role to token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // On Google sign-in, look up or create the user
      if (account?.provider === "google") {
        const existingUser = await db.user.findUnique({
          where: { email: token.email! },
        });

        if (existingUser) {
          // Link Google to existing account
          token.id = existingUser.id;
          token.role = existingUser.role;

          // Mark email as verified since Google verifies it
          if (!existingUser.emailVerified) {
            await db.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: true },
            });
          }
        } else {
          // Create new customer account from Google
          const newUser = await db.user.create({
            data: {
              email: token.email!,
              name: token.name,
              role: "CUSTOMER",
              emailVerified: true,
            },
          });
          token.id = newUser.id;
          token.role = newUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Expose id and role on session.user for use in components and API routes
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
});
```

### Key decisions

- **JWT strategy, not database sessions.** For a stateless API consumed by both the dashboard and storefront, JWT avoids a DB lookup on every request. Tradeoff: you can't revoke individual sessions server-side. Acceptable for V1 — if session revocation becomes a requirement, switch to database sessions later.
- **Token lifetime: 30 days.** Set in `auth.ts` options. Dashboard staff can always re-login. Customers expect to stay logged in.
- **Google OAuth is customer-only.** Google login creates `CUSTOMER` accounts. Staff/admin accounts are always created via credentials (invite flow). This prevents someone from accessing the dashboard just because they have a Google account.
- **Google links to existing accounts by email.** If a customer registered with email/password first, then logs in with Google, they get their existing account — not a duplicate. This is a common UX pitfall.
- **`passwordHash` is nullable.** Users who sign up via Google have no password. They can set one later through the "set password" flow (treated like password reset).

---

## 4. Middleware — Route Protection

### File: `src/middleware.ts`

```ts
// src/middleware.ts

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes that require authentication
const protectedPatterns = [
  "/dashboard",    // all dashboard routes — STAFF or ADMIN only
  "/account",      // customer account pages — any authenticated user
];

// Routes restricted to specific roles
const roleRestrictions: Record<string, string[]> = {
  "/dashboard": ["ADMIN", "STAFF"],
};

// Routes that should redirect to dashboard if already logged in
const authPages = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  // Already authenticated users hitting login/register → redirect
  if (authPages.some((p) => pathname.startsWith(p))) {
    if (session?.user) {
      const dest =
        session.user.role === "CUSTOMER" ? "/" : "/dashboard";
      return NextResponse.redirect(new URL(dest, nextUrl));
    }
    return NextResponse.next();
  }

  // Check protected routes
  const isProtected = protectedPatterns.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Not authenticated → redirect to login
  if (!session?.user) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role restrictions
  for (const [pattern, allowedRoles] of Object.entries(roleRestrictions)) {
    if (pathname.startsWith(pattern)) {
      if (!allowedRoles.includes(session.user.role)) {
        // Authenticated but wrong role → 403 page or redirect home
        return NextResponse.redirect(new URL("/", nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  // Run middleware on all routes except static files and API routes
  // API routes handle their own auth via `getServerSession` or `auth()` wrapper
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Why middleware doesn't cover API routes

API routes handle auth themselves because:
1. Some API routes are fully public (`GET /api/products`, `GET /api/shipping/rates`)
2. Some need fine-grained role checks per HTTP method (e.g. `GET /api/orders` is customer-scoped, `PATCH /api/orders/[id]` is staff-only)
3. Webhook routes (`/api/webhooks/*`) have their own signature-based auth

Middleware is the wrong tool for this level of granularity — it can only allow/deny entire paths.

---

## 5. API Route Auth Helpers

### File: `src/core/auth/helpers.ts`

```ts
// src/core/auth/helpers.ts — Reusable auth utilities for API routes

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

// Get the current session, or null
export async function getSession() {
  return await auth();
}

// Require authentication — returns session or throws 401
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError("Unauthorized", 401);
  }
  return session;
}

// Require specific role(s) — returns session or throws 403
export async function requireRole(...roles: Role[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role as Role)) {
    throw new AuthError("Forbidden", 403);
  }
  return session;
}

// Require STAFF or ADMIN (most common dashboard check)
export async function requireDashboardAccess() {
  return requireRole("ADMIN", "STAFF");
}

// Require ADMIN only (settings, team management)
export async function requireAdmin() {
  return requireRole("ADMIN");
}

// Custom error class for auth failures
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// Wrapper for API route handlers that catches AuthError and returns proper responses
export function withAuth(
  handler: (req: Request) => Promise<NextResponse>
) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      throw error; // re-throw non-auth errors
    }
  };
}
```

### Usage in an API route

```ts
// src/app/api/orders/[id]/route.ts

import { requireAuth, requireDashboardAccess, withAuth } from "@/core/auth/helpers";

// Customer can view their own order; staff/admin can view any order
export const GET = withAuth(async (req) => {
  const session = await requireAuth();
  const order = await getOrder(id);

  if (session.user.role === "CUSTOMER" && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
});

// Only staff/admin can update order status
export const PATCH = withAuth(async (req) => {
  await requireDashboardAccess();
  // ... update logic
});
```

---

## 6. Auth Flows — Complete Specification

### 6.1 Customer Registration

**Route:** `POST /api/auth/register`
**Access:** Public
**Storefront page:** `/register` (client-owned UI)

```ts
// Request
{
  "email": "customer@example.com",
  "password": "securepassword",   // min 8 chars, validated by Zod
  "name": "John Doe"              // optional
}

// Response (201)
{
  "user": { "id": "...", "email": "...", "name": "..." }
}

// Error responses
// 400 — validation error (weak password, invalid email)
// 409 — email already exists
```

**Flow:**

```
1. Validate input with Zod
2. Check if email already exists → 409 if yes
3. Hash password with bcrypt (12 salt rounds)
4. Create User with role: CUSTOMER, emailVerified: false
5. Return user (do NOT auto-sign-in — let the storefront handle redirect)
6. (Optional) Send verification email if storeConfig.auth.emailVerificationRequired
```

**Decision:** Registration does NOT auto-sign-in the user on the server side. The storefront calls `signIn("credentials", ...)` after a successful registration response. This keeps the API stateless and lets the storefront control the UX (e.g. show a "check your email" screen before login if verification is required).

---

### 6.2 Customer Login

**Route:** Handled by Auth.js `POST /api/auth/callback/credentials`
**Storefront page:** `/login` (client-owned UI)

```
1. Storefront calls signIn("credentials", { email, password, redirect: false })
2. Auth.js authorize() callback validates credentials (see §3)
3. JWT token set in httpOnly cookie
4. Storefront redirects based on role (CUSTOMER → /, STAFF/ADMIN → /dashboard)
```

**Security details:**
- JWT stored in `__Secure-next-auth.session-token` httpOnly cookie (set by Auth.js automatically)
- Token lifetime: 30 days (`maxAge` in auth config)
- No refresh token needed — JWT is re-issued on every `auth()` call through Auth.js's rolling window

---

### 6.3 Google OAuth Login

**Route:** Handled by Auth.js `GET /api/auth/signin/google`
**Storefront page:** `/login` (client-owned — includes "Sign in with Google" button)
**Availability:** Only if `storeConfig.auth.googleEnabled === true`

```
1. User clicks "Sign in with Google"
2. Storefront calls signIn("google")
3. Redirect to Google consent screen → callback to /api/auth/callback/google
4. jwt() callback (see §3):
   a. If email exists in DB → link to existing account, set emailVerified = true
   b. If email is new → create CUSTOMER account with emailVerified = true
5. JWT token set, redirect to /
```

**Key rule:** Google OAuth **always creates CUSTOMER** accounts. Never STAFF or ADMIN. Staff accounts are created only through the invite flow (§6.6).

---

### 6.4 Password Reset

**Route:** `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`
**Storefront page:** `/forgot-password` and `/reset-password` (client-owned UI)

#### Step 1: Request Reset

```ts
// POST /api/auth/forgot-password
// Request
{ "email": "customer@example.com" }

// Response (always 200 — do not leak whether email exists)
{ "message": "If that email exists, a reset link has been sent." }
```

**Flow:**

```
1. Look up user by email
2. If user not found → still return 200 (prevent email enumeration)
3. If user found:
   a. Invalidate any existing unexpired reset tokens for this user
   b. Generate a cryptographically random token (crypto.randomBytes(32).toString("hex"))
   c. Create PasswordResetToken with 1-hour expiry
   d. Send email with link: {SITE_URL}/reset-password?token={token}
4. Return 200
```

#### Step 2: Reset Password

```ts
// POST /api/auth/reset-password
// Request
{
  "token": "abc123...",
  "password": "newSecurePassword"
}

// Response (200)
{ "message": "Password has been reset." }

// Error responses
// 400 — invalid/expired/used token, or weak password
```

**Flow:**

```
1. Find PasswordResetToken by token value
2. Validate: not expired, not already used
3. Hash new password with bcrypt (12 salt rounds)
4. Update User.passwordHash
5. Mark token as used (set usedAt = now())
6. Set User.emailVerified = true (they proved email ownership)
7. Return 200 (storefront redirects to login)
```

---

### 6.5 Guest Checkout → Account Linking

**This is the most commonly overlooked flow in e-commerce auth.**

When `storeConfig.guestCheckoutEnabled === true`, guests can place orders using just an email. If they later register with the same email, their past orders should appear in their account.

**Implementation:**

```
On customer registration or first login (any method):
1. After creating/finding the User record
2. Query: SELECT * FROM Order WHERE guestEmail = user.email AND userId IS NULL
3. Update matching orders: SET userId = user.id
4. This runs once, automatically, inside the registration/first-login flow
```

**Where this lives:** `src/core/auth/link-guest-orders.ts`

```ts
// src/core/auth/link-guest-orders.ts

export async function linkGuestOrders(userId: string, email: string) {
  await db.order.updateMany({
    where: {
      guestEmail: email,
      userId: null,
    },
    data: {
      userId: userId,
    },
  });
}
```

Called from:
- `POST /api/auth/register` — after creating the user
- `jwt()` callback — on first Google OAuth sign-in when creating a new user

---

### 6.6 Staff Invite Flow

**Dashboard page:** `/dashboard/settings/team` (ADMIN only)
**Routes:** `POST /api/auth/invite` and `POST /api/auth/accept-invite`

#### Step 1: Admin Sends Invite

```ts
// POST /api/auth/invite (ADMIN only)
// Request
{
  "email": "staff@agency.com",
  "role": "STAFF"    // ADMIN can also invite other ADMINs
}

// Response (201)
{
  "invite": { "id": "...", "email": "...", "role": "...", "expiresAt": "..." }
}

// Error responses
// 400 — invalid email
// 409 — user with this email already exists
// 403 — not ADMIN
```

**Flow:**

```
1. requireAdmin()
2. Validate email doesn't belong to an existing user → 409
3. Generate cryptographically random invite token
4. Create StaffInvite with 7-day expiry, invitedBy = session.user.id
5. Send email with link: {SITE_URL}/accept-invite?token={token}
6. Return invite record
```

#### Step 2: Staff Accepts Invite

```ts
// POST /api/auth/accept-invite
// Request
{
  "token": "abc123...",
  "name": "Staff Name",
  "password": "securepassword"
}

// Response (201)
{
  "user": { "id": "...", "email": "...", "name": "...", "role": "STAFF" }
}

// Error responses
// 400 — invalid/expired/used token, or weak password
```

**Flow:**

```
1. Find StaffInvite by token
2. Validate: not expired, not already accepted
3. Hash password with bcrypt
4. Create User with role from invite, emailVerified = true
5. Mark invite as accepted (set acceptedAt = now())
6. Return user (staff member logs in via normal credentials flow)
```

**Dashboard UI (`/dashboard/settings/team`):**
- List all staff/admin users
- List pending invites (with option to revoke)
- "Invite Team Member" button → email + role form
- ADMIN can deactivate staff (future: add `isActive` boolean to User)

---

### 6.7 Logout

```
1. Storefront or dashboard calls signOut()
2. Auth.js clears the session cookie
3. Redirect to /
```

No server-side session to invalidate (JWT strategy). The cookie deletion is the only action.

---

## 7. Store Config — Auth Section

Extend the existing `store.config.ts` with an auth block:

```ts
// src/config/store.config.ts (auth section)

export const storeConfig = {
  // ... existing config (name, currency, locale, etc.)

  auth: {
    // Allow customers to register accounts
    customerRegistrationEnabled: true,

    // Allow Google OAuth login for customers
    googleEnabled: false,

    // Require email verification before login
    // (V1: false by default — enable per-client if needed)
    emailVerificationRequired: false,

    // Allow checkout without an account
    guestCheckoutEnabled: true,

    // Password policy
    passwordMinLength: 8,
  },
} satisfies StoreConfig;
```

**Note:** `guestCheckoutEnabled` moves from the top level into `auth` for organizational clarity. This is a minor breaking change from the Architecture doc's example — update the Architecture doc when this spec is approved.

---

## 8. File Map

Where every auth-related file lives in the repo:

```
src/
├── lib/
│   └── auth.ts                           # Auth.js v5 config (providers, callbacks, session)
├── core/
│   └── auth/
│       ├── helpers.ts                    # requireAuth, requireRole, withAuth wrapper
│       ├── register.ts                   # Customer registration logic
│       ├── password-reset.ts             # Token generation, validation, password update
│       ├── invite.ts                     # Staff invite creation, acceptance
│       ├── link-guest-orders.ts          # Guest order → account linking
│       └── types.ts                      # Auth-related TypeScript types
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts    # Auth.js catch-all route handler
│   │       ├── register/route.ts         # POST — customer registration
│   │       ├── forgot-password/route.ts  # POST — request password reset
│   │       ├── reset-password/route.ts   # POST — execute password reset
│   │       ├── invite/route.ts           # POST — send staff invite (ADMIN)
│   │       └── accept-invite/route.ts    # POST — accept staff invite
│   ├── (storefront)/
│   │   ├── login/page.tsx                # CLIENT-OWNED — login UI
│   │   ├── register/page.tsx             # CLIENT-OWNED — registration UI
│   │   ├── forgot-password/page.tsx      # CLIENT-OWNED — forgot password UI
│   │   ├── reset-password/page.tsx       # CLIENT-OWNED — reset password UI
│   │   ├── accept-invite/page.tsx        # CORE-OWNED — invite acceptance (same UI for all clients)
│   │   └── account/
│   │       ├── page.tsx                  # CLIENT-OWNED — account overview
│   │       ├── orders/page.tsx           # CLIENT-OWNED — order history
│   │       └── addresses/page.tsx        # CLIENT-OWNED — address management
│   └── (dashboard)/
│       └── dashboard/
│           └── settings/
│               └── team/page.tsx         # CORE-OWNED — staff management
├── middleware.ts                          # Route protection (see §4)
└── config/
    └── store.config.ts                   # Auth config flags (see §7)
```

---

## 9. Environment Variables

Add to `.env.example`:

```env
# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-32-char-secret

# Google OAuth (optional — only if storeConfig.auth.googleEnabled)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email (for password reset, staff invites)
# Provider TBD — see Email/Notification Spec
EMAIL_FROM=noreply@clientdomain.com
```

---

## 10. Security Considerations

| Concern | Mitigation |
|---|---|
| Brute-force login | Rate limit `/api/auth/callback/credentials` — 5 attempts per IP per 15 min. Implement via middleware or an in-memory store (upstash/ratelimit or similar). |
| Password storage | bcrypt with 12 salt rounds. Never store plaintext. Never log passwords. |
| Email enumeration | `/forgot-password` always returns 200 regardless of whether email exists. `/register` returns 409 for existing emails — acceptable tradeoff (most e-commerce sites do this). |
| Token security | Password reset tokens: 32 random bytes, 1-hour expiry, single-use. Staff invite tokens: 32 random bytes, 7-day expiry, single-use. |
| JWT tampering | Auth.js signs JWTs with `NEXTAUTH_SECRET`. Verify this is a strong random value (not "mysecret"). |
| OAuth account takeover | Google OAuth links by email match. Acceptable because Google verifies email ownership. Do NOT add this pattern for other OAuth providers that don't verify emails. |
| XSS / cookie theft | JWT stored in httpOnly, Secure, SameSite=Lax cookie (Auth.js defaults). Not accessible from JavaScript. |
| CSRF | Auth.js v5 includes built-in CSRF protection for sign-in/sign-out actions. |

---

## 11. Testing Checklist

Minimum test coverage before this is considered production-ready:

### Unit Tests (`src/core/auth/`)

- [ ] `register.ts` — creates user with hashed password, rejects duplicate email, validates password strength
- [ ] `password-reset.ts` — generates token, rejects expired tokens, rejects used tokens, updates password
- [ ] `invite.ts` — creates invite, rejects non-admin callers, rejects existing-user emails, validates token on accept
- [ ] `link-guest-orders.ts` — links orders by email, ignores orders already assigned to a user
- [ ] `helpers.ts` — `requireAuth` throws 401, `requireRole` throws 403, `withAuth` catches and formats errors

### Integration Tests

- [ ] Full credentials login flow (register → login → access protected route → logout)
- [ ] Dashboard access denied for CUSTOMER role
- [ ] Staff invite flow (admin invites → staff accepts → staff can access dashboard)
- [ ] Password reset flow (request → token → reset → login with new password)
- [ ] Guest checkout → register → orders linked

---

## 12. Decisions Explicitly Deferred to V2

| Feature | Why deferred |
|---|---|
| Granular permissions (per-feature RBAC) | V1 only has 3 roles. No client has requested fine-grained permissions. Add when a client needs "can manage orders but not products." |
| Two-factor authentication (2FA) | Adds complexity to the staff login flow. Add when a client handles high-value inventory or has compliance requirements. |
| Account deactivation / soft delete | V1 can delete users. Add `isActive` flag when a client needs to suspend accounts without deleting data. |
| Social logins beyond Google | Each OAuth provider has quirks (email verification, token refresh). Add per-client when needed. |
| Session revocation (force logout) | Requires switching from JWT to database sessions. Add if a client needs "log out all devices" functionality. |
| Magic link / passwordless login | Nice UX but adds email dependency to the login flow. Evaluate for V2. |

---

## 13. Dependency on Email Spec

This auth spec **requires an email sending capability** for:

1. Password reset emails
2. Staff invite emails
3. (Optional) Email verification

The actual email provider, template system, and sending infrastructure are defined in the **Email/Notification Spec** (separate document). For implementation purposes, assume a `sendEmail(to, subject, html)` function will be available from `src/core/email/send.ts`.

If the Email spec is not yet written when auth development begins, the developer should:
1. Create a placeholder `sendEmail` that logs to console in development
2. Wire up the real implementation when the Email spec is delivered

This allows auth development to proceed without blocking on the Email spec.
