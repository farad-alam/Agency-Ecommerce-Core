# Agency Ecommerce Core — Security Checklist

**Version:** v1.0
**Scope:** Authentication, API, Data, Infrastructure, Client-side

---

## How to Use This Document

This checklist is reviewed in two contexts:
1. **Sprint 5** — before the Core is declared production-ready
2. **Each client deployment** — before going live with a client project

Items marked 🔴 are critical — deployment is blocked until resolved.
Items marked 🟡 are important — resolve before launch.
Items marked 🟢 are hardening — resolve within 2 weeks of launch.

---

## 1. Authentication & Session

| # | Check | Priority | Implementation |
|---|---|---|---|
| 1.1 | Passwords hashed with bcrypt, 12 salt rounds | 🔴 | `bcrypt.hash(password, 12)` in `register.ts` and `accept-invite.ts` |
| 1.2 | `NEXTAUTH_SECRET` is a strong random value (≥ 32 chars) | 🔴 | `openssl rand -base64 32` — never use a memorable string |
| 1.3 | JWT stored in httpOnly, Secure, SameSite=Lax cookie | 🔴 | Auth.js default — verify not overridden |
| 1.4 | JWT is not accessible from JavaScript | 🔴 | httpOnly cookie — verify in browser DevTools |
| 1.5 | Password reset tokens expire in 1 hour | 🔴 | `expiresAt = now + 1 hour` in `password-reset.ts` |
| 1.6 | Password reset tokens are single-use | 🔴 | Set `usedAt = now()` after use; check `usedAt IS NULL` before use |
| 1.7 | Staff invite tokens expire in 7 days | 🟡 | `expiresAt = now + 7 days` in `invite.ts` |
| 1.8 | Google OAuth only creates CUSTOMER accounts | 🔴 | `role: "CUSTOMER"` hardcoded in jwt() callback for Google sign-in |
| 1.9 | Forgot-password always returns 200 (no email enumeration) | 🟡 | Verified in `forgot-password/route.ts` |
| 1.10 | Session token lifetime is 30 days, not unlimited | 🟡 | Set `maxAge: 30 * 24 * 60 * 60` in Auth.js config |
| 1.11 | Auth.js CSRF protection is active | 🟡 | Auth.js v5 default — do not disable |

---

## 2. API Security

| # | Check | Priority | Implementation |
|---|---|---|---|
| 2.1 | All mutation endpoints check authentication | 🔴 | `requireAuth()` or `requireDashboardAccess()` in every POST/PATCH/DELETE |
| 2.2 | Role checked at the method level, not just the route level | 🔴 | `GET /api/orders` (customer-scoped) vs `PATCH /api/orders/[id]` (STAFF only) |
| 2.3 | Rate limiting on auth endpoints (5 req / 15 min / IP) | 🔴 | Upstash + middleware rate limiter |
| 2.4 | Rate limiting on API mutations (60 req / min / IP) | 🟡 | Same middleware |
| 2.5 | Webhook routes bypass IP rate limiting | 🔴 | Excluded from rate limiter matcher — verified |
| 2.6 | Webhook signature verified before processing | 🔴 | `provider.verifyWebhook(req)` — first line of webhook handler |
| 2.7 | Webhook handler returns 200 even on processing errors | 🟡 | Prevents provider retries flooding the system |
| 2.8 | Webhook idempotency — duplicate events ignored | 🟡 | Check `paymentStatus === "PAID"` before processing |
| 2.9 | Clients can only access their own orders | 🔴 | `order.userId === session.user.id` check in GET /api/orders/[id] |
| 2.10 | Admin-only endpoints correctly locked to ADMIN role | 🔴 | `requireAdmin()` on `/api/settings/*`, `/api/auth/invite` |
| 2.11 | `paymentProvider` param validated against `storeConfig.paymentProviders` | 🔴 | Checkout validation step — prevents unknown providers |
| 2.12 | Server-side price recalculation — client totals never trusted | 🔴 | `calculateCartTotals()` called server-side in checkout — verified |
| 2.13 | Cron routes protected with `CRON_SECRET` | 🔴 | `authorization: Bearer ${process.env.CRON_SECRET}` check |

---

## 3. Data & Database

| # | Check | Priority | Implementation |
|---|---|---|---|
| 3.1 | No raw SQL strings with user input | 🔴 | Use Prisma's typed query builder — avoid `db.$queryRaw` with interpolation |
| 3.2 | Prisma handles SQL injection via parameterised queries | 🔴 | Prisma default — don't bypass with `$queryRawUnsafe` |
| 3.3 | Order items snapshot product data at purchase time | 🔴 | `productTitle`, `price`, `variantOptions`, `sku` stored on `OrderItem` |
| 3.4 | Inventory decrement inside a `$transaction` | 🔴 | Atomic decrement-then-check in `create-order.ts` |
| 3.5 | Guest emails not leaked across orders | 🟡 | `guestEmail` only returned to the order owner or STAFF — not in public responses |
| 3.6 | Passwords never logged or included in API responses | 🔴 | Audit all User response schemas — `passwordHash` never in any response type |
| 3.7 | Database credentials unique per client deployment | 🔴 | Each client has their own Neon project — never shared |
| 3.8 | Neon connection string uses SSL | 🟡 | Neon default — verify `?sslmode=require` in connection string |
| 3.9 | Soft-delete policy for orders | 🟡 | Orders are never hard-deleted — use CANCELLED status instead |

---

## 4. Input Validation & Sanitisation

| # | Check | Priority | Implementation |
|---|---|---|---|
| 4.1 | All request bodies validated with Zod | 🔴 | `parseBody()` in every API route |
| 4.2 | All query parameters validated with Zod | 🟡 | `parseQuery()` in every GET route |
| 4.3 | Product description stored as plain text (not HTML) | 🟡 | Storefront renders via a markdown or plain-text renderer — not `dangerouslySetInnerHTML` |
| 4.4 | If rich text (HTML) is allowed, sanitise before storing | 🟡 | Use `DOMPurify` (client) or `sanitize-html` (server) — not raw HTML strings |
| 4.5 | File upload type restrictions (images only for media) | 🟡 | Cloudinary upload preset restricts to `image/*` — verify preset config |
| 4.6 | Max file size enforced on uploads | 🟡 | Cloudinary upload preset: max 10MB for product images |
| 4.7 | Slug fields validated: only lowercase alphanumeric + hyphens | 🟡 | `z.string().regex(/^[a-z0-9-]+$/)` in all slug schemas |
| 4.8 | Coupon code normalised to uppercase | 🟡 | `.toUpperCase()` in coupon Zod schema |
| 4.9 | Email fields always lowercased before DB write | 🟡 | `.toLowerCase()` on email in register and login |

---

## 5. Headers & Transport

| # | Check | Priority | Implementation |
|---|---|---|---|
| 5.1 | `X-Frame-Options: DENY` | 🟡 | Set in middleware security headers |
| 5.2 | `X-Content-Type-Options: nosniff` | 🟡 | Set in middleware security headers |
| 5.3 | `Referrer-Policy: strict-origin-when-cross-origin` | 🟢 | Set in middleware security headers |
| 5.4 | Content Security Policy (CSP) configured | 🟡 | Configured in `next.config.js` headers |
| 5.5 | CSP includes payment provider script sources | 🔴 | `js.stripe.com` (Stripe), payment gateway domains for bKash/PayTabs |
| 5.6 | CSP includes Cloudinary image sources | 🟡 | `res.cloudinary.com` in `img-src` |
| 5.7 | HTTPS enforced in production | 🔴 | Vercel enforces HTTPS by default — verify no HTTP redirects disabled |
| 5.8 | `Secure` cookie flag active in production | 🟡 | Auth.js sets this automatically when `NEXTAUTH_URL` is HTTPS |
| 5.9 | CORS only allows known origins | 🟡 | `ALLOWED_ORIGINS` in middleware — not wildcard `*` |

---

## 6. Dependency Security

| # | Check | Priority | Implementation |
|---|---|---|---|
| 6.1 | `npm audit` — zero high/critical vulnerabilities | 🔴 | Run `npm audit --audit-level=high` in CI |
| 6.2 | Dependencies pinned with `package-lock.json` | 🟡 | `npm ci` (not `npm install`) in CI — uses lockfile |
| 6.3 | Dependabot / Renovate configured for auto-PR on updates | 🟢 | `.github/dependabot.yml` |
| 6.4 | Auth.js, Prisma, Next.js on latest stable versions at launch | 🟡 | Checked before Sprint 5 ends |

---

## 7. Vercel & Infrastructure

| # | Check | Priority | Implementation |
|---|---|---|---|
| 7.1 | `NEXTAUTH_SECRET` set in Vercel — not in code | 🔴 | Vercel environment variable — never committed to git |
| 7.2 | Payment provider live keys only in production environment | 🔴 | Vercel "Production" environment — not Preview |
| 7.3 | `.env` and `.env.local` in `.gitignore` | 🔴 | Checked before first commit |
| 7.4 | No secrets in source code | 🔴 | Run `git log -p` grep for key patterns before first push |
| 7.5 | Vercel project access limited to team members | 🟡 | Remove personal accounts; use team project |
| 7.6 | Neon database access restricted to Vercel IP / connection string only | 🟢 | Neon IP allow-listing for production DB |
| 7.7 | Client handed Vercel project ownership at delivery | 🟢 | Transfer project in Vercel dashboard at project handoff |

---

## 8. Error Handling & Information Disclosure

| # | Check | Priority | Implementation |
|---|---|---|---|
| 8.1 | Stack traces never returned in API responses | 🔴 | `handleError()` returns generic message for unknown errors |
| 8.2 | Internal error details not exposed to clients | 🔴 | `AppError` messages are pre-written — not raw exception messages |
| 8.3 | Prisma error codes not leaked | 🔴 | `handleError()` maps P2002, P2025 to standard error responses |
| 8.4 | `console.error` used for server-side errors (not exposed to client) | 🟡 | Reviewed in Logging & Monitoring Spec |

---

## Pre-Launch Checklist Summary

Run these commands before every production deployment:

```bash
# 1. Dependency audit
npm audit --audit-level=high

# 2. Type check (no any errors)
npm run type-check

# 3. Lint (no warnings)
npm run lint

# 4. Full test suite
npm run test && npm run test:integration

# 5. Schema validation
npx prisma validate

# 6. Environment variable audit — verify no .env in git
git status
grep -r "sk_live" src/    # should return nothing
grep -r "NEXTAUTH_SECRET" src/   # should return nothing

# 7. Build succeeds
npm run build
```
