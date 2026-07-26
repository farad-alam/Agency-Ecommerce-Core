# Agency Ecommerce Core — Logging & Monitoring

**Version:** v1.0
**Error Tracking:** Sentry
**Logging:** Structured console logging (Vercel captures automatically)
**Uptime:** Vercel built-in + BetterUptime (optional)

---

## 0. Monitoring Philosophy

For an agency template platform, monitoring must be:
- **Low overhead to set up** — one integration, not five
- **Per-client** — each client deployment has their own Sentry project
- **Actionable** — alerts fire for real problems, not noise

---

## 1. Structured Logging

Vercel captures `console.log`, `console.warn`, and `console.error` from serverless functions and displays them in the Vercel dashboard under "Functions Logs". Use structured JSON logging so logs are parseable.

### Logger Utility

```ts
// src/lib/logger.ts

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level:     LogLevel;
  message:   string;
  timestamp: string;
  context?:  Record<string, unknown>;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context } : {}),
  };

  // In production: output JSON for log aggregation
  // In development: output readable format
  if (process.env.NODE_ENV === "production") {
    console[level === "info" ? "log" : level](JSON.stringify(entry));
  } else {
    const prefix = { info: "ℹ️", warn: "⚠️", error: "❌" }[level];
    console[level === "info" ? "log" : level](
      `${prefix} [${entry.timestamp}] ${message}`,
      context ?? ""
    );
  }
}

export const logger = {
  info:  (message: string, context?: Record<string, unknown>) => log("info",  message, context),
  warn:  (message: string, context?: Record<string, unknown>) => log("warn",  message, context),
  error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
};
```

### Usage Examples

```ts
// Order created
logger.info("Order created", { orderNumber, userId, total, paymentProvider });

// Payment webhook received
logger.info("Payment webhook received", { provider, eventType: event.type, paymentRef });

// Payment failed
logger.warn("Payment failed", { orderNumber, paymentRef, provider });

// Unhandled error (inside handleError())
logger.error("Unhandled error", {
  name:    error?.name,
  message: error?.message,
  path:    req.url,
  method:  req.method,
});

// Webhook signature invalid
logger.warn("Webhook signature verification failed", { provider, path: req.url });
```

### What to Log (and what not to)

| Log | ✅ Log | ❌ Never Log |
|---|---|---|
| Order events | `orderNumber`, `status`, `total` | Item details, customer addresses |
| Payment events | `provider`, `paymentRef`, `status` | Card numbers, payment method details |
| Auth events | `userId`, `role`, `action` | Passwords, tokens, credentials |
| Error events | `message`, `statusCode`, `path` | Stack traces in production responses |
| Webhook events | `provider`, `eventType` | Full raw webhook payload (too verbose) |

---

## 2. Sentry — Error Tracking

### Setup

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

This creates `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`.

### Configuration

```ts
// sentry.server.config.ts

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only send errors — not debug logs
  environment: process.env.NODE_ENV,

  // Ignore noisy, low-signal errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],

  beforeSend(event) {
    // Scrub sensitive data before sending to Sentry
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      if (data.password)   data.password   = "[REDACTED]";
      if (data.token)      data.token      = "[REDACTED]";
      if (data.cardNumber) data.cardNumber = "[REDACTED]";
    }
    return event;
  },
});
```

### Capturing Errors

```ts
// In handleError() — src/core/errors/handler.ts — add Sentry capture

import * as Sentry from "@sentry/nextjs";

export function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    // Don't send 4xx client errors to Sentry — only real errors
    if (error.statusCode >= 500) {
      Sentry.captureException(error);
    }
    return NextResponse.json(/* ... */);
  }

  // Unknown errors always go to Sentry
  Sentry.captureException(error, {
    extra: { type: typeof error },
  });

  logger.error("Unhandled error", {
    name:    (error as Error)?.name,
    message: (error as Error)?.message,
  });

  return NextResponse.json(
    { error: "An unexpected error occurred", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
```

### Contextual Data (Per Request)

```ts
// In critical API routes, add user context so Sentry shows who was affected
import * as Sentry from "@sentry/nextjs";

Sentry.setUser({ id: session.user.id, email: session.user.email });
```

### Sentry Alerts Configuration (Per Project)

Configure in the Sentry dashboard:

| Alert | Condition | Notify |
|---|---|---|
| New issue | First occurrence | Email + Slack |
| Regression | Previously resolved issue re-appears | Email |
| Error spike | > 10 errors/min | Email + Slack |
| Payment webhook failure | Any `webhook.*.error` event | Email immediately |

---

## 3. Per-Client Sentry Setup

Each client deployment gets its own Sentry project:

1. Create project in Sentry dashboard: `client-{name}-production`
2. Add `SENTRY_DSN` to Vercel environment variables
3. Add `SENTRY_ORG` and `SENTRY_PROJECT` for source map uploads
4. Invite client as a Sentry member (view-only) — optional

```env
# .env (per-client)
SENTRY_DSN=https://...@o123456.ingest.sentry.io/...
SENTRY_ORG=agency-name
SENTRY_PROJECT=client-name-production
```

---

## 4. Performance Monitoring

### Vercel Analytics

Enable in `next.config.js`:

```js
// next.config.js
module.exports = {
  experimental: {
    // Enable Vercel Speed Insights
  },
};
```

Add to layout:

```tsx
// src/app/layout.tsx
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Core Web Vitals Targets

| Metric | Target | Monitoring |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Vercel Speed Insights |
| CLS (Cumulative Layout Shift) | < 0.1 | Vercel Speed Insights |
| INP (Interaction to Next Paint) | < 200ms | Vercel Speed Insights |
| TTFB (Time to First Byte) | < 600ms | Vercel Speed Insights |

Product pages with many images are the most likely to fail LCP — ensure product images use `next/image` with `priority` on the first visible image.

---

## 5. Uptime Monitoring

### Option A — BetterUptime (Recommended)

- Free tier: 1-minute checks, unlimited monitors
- Monitors: `/` (homepage), `/api/products` (core API health), `/dashboard`
- Alert on: HTTP non-2xx, response time > 5s, SSL expiry < 14 days

### Option B — Vercel Built-in

Vercel Pro/Enterprise includes deployment health checks and function failure alerts. For free-tier deployments, use BetterUptime or UptimeRobot.

### Health Check Endpoint

```ts
// src/app/api/health/route.ts

import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Lightweight DB check — just validates connection
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status:    "ok",
      timestamp: new Date().toISOString(),
      version:   process.env.CORE_VERSION ?? "unknown",
    });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
```

Configure BetterUptime to monitor `/api/health` and expect `{ "status": "ok" }` in the response body.

---

## 6. Payment Monitoring

Payment failures need immediate visibility. In addition to Sentry:

```ts
// In the webhook handler, log every payment event
// src/app/api/webhooks/payments/[provider]/route.ts

if (event.type === "payment.failed") {
  logger.warn("Payment failed", {
    provider:    params.provider,
    paymentRef:  event.paymentRef,
    orderId:     order.id,
    orderNumber: order.orderNumber,
    total:       order.total,
  });

  // Sentry fingerprint — groups all payment failures together
  Sentry.captureMessage("Payment failed", {
    level: "warning",
    fingerprint: ["payment-failed", params.provider],
    extra: { orderId: order.id, paymentRef: event.paymentRef },
  });
}
```

---

## 7. Dashboard — Error Visibility

The dashboard overview page (`/dashboard`) should surface recent operational errors:

- Last 24h error count (from Sentry API or a simple DB counter)
- Failed payment count in the last 7 days (query from Order where paymentStatus = FAILED)
- Low stock alert count (from inventory query)

These are already covered by the analytics widgets spec — no additional implementation needed. The key insight is that these dashboard metrics **double as a monitoring tool** for the store operator without needing them to check a separate tool.

---

## 8. Log Retention & Cost

| Service | Free Tier | Retention |
|---|---|---|
| Vercel Function Logs | 1 hour (Hobby), 1 day (Pro) | — |
| Sentry | 5,000 errors/month | 30 days |
| BetterUptime | Unlimited monitors | 1 year |
| Vercel Analytics | 2,500 events/month | 30 days |

For most early-stage client deployments, these free tiers are sufficient. Upgrade Sentry to Team ($26/mo) if a client has high error volume or needs 90-day retention.

---

## 9. File Map

```
src/
├── lib/
│   └── logger.ts                          # Structured logger utility
├── app/
│   └── api/
│       └── health/route.ts                # Health check endpoint
├── sentry.client.config.ts                # Sentry client-side init
├── sentry.server.config.ts                # Sentry server-side init
└── sentry.edge.config.ts                  # Sentry edge runtime init
```

---

## 10. Environment Variables

```env
# Sentry
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=agency-name
SENTRY_PROJECT=client-name

# App version (used in health check + Sentry releases)
CORE_VERSION=1.0.0
```

---

## 11. First-Time Setup Checklist

- [ ] Sentry project created for this client
- [ ] `SENTRY_DSN` added to Vercel environment variables
- [ ] `/api/health` responding with 200 in production
- [ ] BetterUptime monitor created for `/api/health`
- [ ] Sentry alerts configured (new issue, regression, spike)
- [ ] Vercel Analytics enabled
- [ ] Vercel Speed Insights enabled
- [ ] First deployment creates a Sentry release (source maps uploaded)
