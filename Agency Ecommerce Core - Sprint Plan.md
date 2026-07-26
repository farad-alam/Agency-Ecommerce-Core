# Agency Ecommerce Core — Sprint Plan v1.0

**Version:** v1.0
**Model:** 2-week sprints
**Team assumption:** 1–2 developers (agency context)
**Total duration:** ~12 weeks (6 sprints) to a production-ready Core

---

## Build Principles

- **Core before Storefront.** Every sprint delivers Core functionality. The reference storefront is built last.
- **Prove payment first.** The most risk lives in payment integration — de-risk it before building dashboard polish.
- **Seed data from day one.** Every feature gets demo data as it's built. The Core should be demo-able after each sprint.
- **No partial features.** A feature is not "done" until its API, dashboard page, validation, error handling, and unit tests are complete.

---

## Sprint 0 — Foundation (Week 1–2)

**Goal:** A running Next.js project with schema, auth, and dev tooling. No features yet, but developers can log in, the DB is seeded, and the full middleware stack is running.

### Deliverables

- [ ] Scaffold repo from `create-next-app` with TypeScript, App Router, Tailwind, shadcn/ui
- [ ] Prisma schema — **complete** (all models from Architecture + Collections + Cart + PasswordResetToken + StaffInvite)
- [ ] Neon database provisioned, `prisma migrate dev` running
- [ ] Auth.js v5 configured: credentials provider, JWT session, role on token
- [ ] `middleware.ts` — route protection, security headers
- [ ] Rate limiting — Upstash Redis setup, auth endpoint limits
- [ ] Error handling — `AppError`, `withHandler`, `handleError`, error code registry
- [ ] Zod env validation (`src/lib/env.ts`)
- [ ] `store.config.ts` — base structure with type
- [ ] API validation helper (`parseBody`, `parseQuery`)
- [ ] Seed script: admin user + store record
- [ ] CORE_VERSION file, CHANGELOG.md stub, CLONE_CHECKLIST.md stub
- [ ] Vitest + Testing Library configured
- [ ] ESLint + Prettier configured
- [ ] `.env.example` with all variables documented

### Definition of Done

Developer can: clone repo → run `npm install` → `npx prisma migrate dev` → `npx prisma db seed` → `npm run dev` → log in to `/dashboard` with seeded admin credentials.

---

## Sprint 1 — Products, Media & Taxonomy (Week 3–4)

**Goal:** Full product management. Dashboard can create, edit, publish products with variants, categories, brands, and images.

### Deliverables

#### Products
- [ ] `GET/POST /api/products` with filtering, search, pagination
- [ ] `GET/PATCH/DELETE /api/products/[id]`
- [ ] Slug auto-generation from title (client-side) with uniqueness check
- [ ] Product status workflow (DRAFT → ACTIVE → ARCHIVED)
- [ ] Unit tests: `createProduct`, `getProductBySlug`, slug conflict detection

#### Variants
- [ ] Variant create/edit/delete within product edit page
- [ ] Dynamic option keys (size, color, etc.) — not hardcoded
- [ ] SKU uniqueness validation

#### Categories & Brands
- [ ] `GET/POST/PATCH/DELETE /api/categories`
- [ ] `GET/POST/PATCH/DELETE /api/brands`
- [ ] Category tree (nested) support in API response
- [ ] Unit tests for category tree queries

#### Collections
- [ ] `GET/POST/PATCH/DELETE /api/collections`
- [ ] Product add/remove/reorder within collection
- [ ] Dashboard: `/dashboard/collections` list and edit page

#### Media
- [ ] Cloudinary signed upload flow (server generates signature, client uploads directly)
- [ ] `POST /api/media/upload` → signed params
- [ ] `POST /api/media/confirm` → save Media record to DB
- [ ] Media library page (`/dashboard/media`)
- [ ] Image re-order on product edit page

#### SEO
- [ ] SEO meta fields on product edit and collection edit
- [ ] `SeoMeta` and `CollectionSeoMeta` create/update

#### Dashboard Pages
- [ ] `/dashboard/products` — list with status filter, search, bulk actions (activate, archive, delete)
- [ ] `/dashboard/products/new` — create form
- [ ] `/dashboard/products/[id]` — edit form with variants tab, media tab, SEO tab
- [ ] `/dashboard/categories` — tree view with add/edit/delete
- [ ] `/dashboard/brands` — list with add/edit/delete
- [ ] `/dashboard/collections` — list, create, edit

### Definition of Done

An admin can create a product with 3 variants, 5 images, assign it to a category and a collection, fill in SEO fields, and publish it via the dashboard.

---

## Sprint 2 — Cart, Checkout & Payment (Week 5–6)

**Goal:** A customer can add items to cart and complete a real payment (Stripe test mode). This is the highest-risk sprint.

### Deliverables

#### Cart
- [ ] `GET /api/cart`, `POST /api/cart/items`, `PATCH/DELETE /api/cart/items/[id]`
- [ ] `POST /api/cart/coupon`, `DELETE /api/cart/coupon`
- [ ] `DELETE /api/cart/clear`
- [ ] Cart session resolver (user + guest + cookie)
- [ ] Cart merge on login
- [ ] Pricing engine: subtotal, coupon (3 types), tax, shipping threshold
- [ ] Unit tests: all pricing scenarios (percentage, fixed, free shipping, min subtotal, expired coupon)

#### Shipping
- [ ] `GET /api/shipping/rates?country=&subtotal=`
- [ ] `GET/POST/PATCH/DELETE /api/shipping/zones`
- [ ] Dashboard: `/dashboard/shipping` — zones + rates management

#### Coupons
- [ ] `GET/POST/PATCH/DELETE /api/coupons`
- [ ] Dashboard: `/dashboard/coupons` — list and create

#### Checkout
- [ ] `POST /api/checkout` — full validation + order creation + inventory decrement
- [ ] Order number generation
- [ ] `db.$transaction` for order + items + inventory

#### Payment — Stripe
- [ ] `PaymentProvider` interface implemented
- [ ] Provider registry
- [ ] `StripeProvider` — `createCheckoutSession`, `verifyWebhook`, `refund`
- [ ] `POST /api/webhooks/payments/stripe` — signature verify, payment.succeeded, payment.failed
- [ ] Inventory restore on payment failure
- [ ] Cart clear + coupon increment on payment success
- [ ] Integration test: full checkout flow in Stripe test mode

#### Email (minimum viable)
- [ ] Resend configured
- [ ] `sendEmail()` utility
- [ ] Order confirmation email triggered by webhook
- [ ] Password reset email triggered by forgot-password flow

### Definition of Done

A developer can: add items to cart as a guest → go through checkout → pay with Stripe test card → receive order confirmation email → see order in dashboard as PAID.

---

## Sprint 3 — Orders, Customers & Reviews (Week 7–8)

**Goal:** Complete order management lifecycle. Staff can manage orders from the dashboard. Customers can track orders.

### Deliverables

#### Orders
- [ ] `GET /api/orders` — customer-scoped (own orders) + dashboard (all orders)
- [ ] `GET /api/orders/[id]` — with full status history
- [ ] `PATCH /api/orders/[id]` — status update (STAFF/ADMIN)
- [ ] `POST /api/orders/[id]/refund` — trigger provider refund + create Refund record
- [ ] `updateOrderStatus()` — fires shipped/cancelled emails
- [ ] Dashboard: `/dashboard/orders` — list with status filter, search by order number/email
- [ ] Dashboard: `/dashboard/orders/[id]` — detail with timeline, status update, refund form

#### Customers
- [ ] `GET /api/customers` — dashboard only
- [ ] `GET /api/customers/[id]` — with orders and addresses
- [ ] Dashboard: `/dashboard/customers` — list with search
- [ ] Dashboard: `/dashboard/customers/[id]` — profile, order history, address list

#### Auth — Remaining Flows
- [ ] `POST /api/auth/register`
- [ ] `POST /api/auth/forgot-password`
- [ ] `POST /api/auth/reset-password`
- [ ] `POST /api/auth/invite`, `POST /api/auth/accept-invite`
- [ ] Dashboard: `/dashboard/settings/team` — staff list, invite form, pending invites
- [ ] Guest → account order linking
- [ ] Unit tests: all auth flows (registration, password reset, invite, guest linking)

#### Reviews
- [ ] `GET /api/reviews` — public + dashboard
- [ ] `POST /api/reviews` — public (goes to PENDING)
- [ ] `PATCH /api/reviews/[id]` — dashboard moderation (APPROVED/REJECTED)
- [ ] Dashboard: `/dashboard/reviews` — moderation queue

#### Inventory Dashboard
- [ ] Dashboard: `/dashboard/inventory` — low stock list, bulk quantity edit

### Definition of Done

Staff can: view all orders, update order status to FULFILLED (triggers shipping email), initiate a partial refund, view customer profiles. Customers can register, log in, reset password, and view their order history.

---

## Sprint 4 — Analytics, Settings & Email Completion (Week 9–10)

**Goal:** Dashboard is feature-complete. Store settings are configurable. All email templates implemented.

### Deliverables

#### Analytics
- [ ] `GET /api/analytics/summary?period=`
- [ ] Revenue, order count, AOV — today / 7d / 30d
- [ ] Top 5 products by units sold
- [ ] Low stock count widget
- [ ] Dashboard: `/dashboard` overview — widgets with period toggle

#### Store Settings
- [ ] `GET/PATCH /api/settings/store` — name, currency, locale, timezone, tax
- [ ] `GET/PATCH /api/settings/payments` — active payment providers config
- [ ] Dashboard: `/dashboard/settings/store`
- [ ] Dashboard: `/dashboard/settings/payments`

#### Email — Remaining Templates
- [ ] `order-shipped` email template
- [ ] `order-cancelled` email template
- [ ] `refund-initiated` email template
- [ ] `email-verification` template (wired up if `storeConfig.auth.emailVerificationRequired`)
- [ ] `staff-invite` template
- [ ] `low-stock-alert` template
- [ ] Vercel cron: low-stock daily check
- [ ] Vercel cron: cart cleanup

#### Storefront SDK
- [ ] `src/storefront-sdk/` — all server functions and hooks (full Storefront SDK Spec)
- [ ] `SWRProvider` configured in storefront layout

#### Cart Cleanup & Expiry
- [ ] `expiresAt` rolling update on cart access
- [ ] `/api/cron/cleanup-carts` cron route

### Definition of Done

Dashboard is 100% functional. All email triggers fire. Settings are configurable without code changes. SDK is ready for storefront development.

---

## Sprint 5 — Regional Payments & Security Hardening (Week 11–12)

**Goal:** Regional payment providers implemented. Security audit complete. Core is production-ready.

### Deliverables

#### Payment — Regional Providers
- [ ] `bKash` provider implementation (Bangladesh)
- [ ] `Nagad` provider implementation (Bangladesh)
- [ ] `PayTabs` provider implementation (Saudi/Gulf)
- [ ] Integration test: end-to-end checkout in sandbox mode for each provider
- [ ] Webhook handler tested for each provider

#### Security Hardening
- [ ] CSP header configured in `next.config.js` (per Security Checklist)
- [ ] Rate limiting verified working in Vercel preview environment
- [ ] Webhook signature verification tests — test malformed/missing signatures
- [ ] Input sanitization audit — ensure no HTML stored in product descriptions without sanitization
- [ ] CLONE_CHECKLIST.md — completed, tested by a developer who wasn't involved in building it

#### Seed Data
- [ ] Full demo dataset (per Seed Data Spec)
- [ ] `npx prisma db seed` runs clean on a fresh DB in < 30 seconds

#### CI/CD Pipeline
- [ ] GitHub Actions: lint, type-check, unit tests on every PR
- [ ] Vercel: preview deployment on PRs
- [ ] Database migration check in CI

#### Documentation
- [ ] CHANGELOG.md — first entry: Core v1.0.0 release
- [ ] CORE_VERSION: `1.0.0`
- [ ] CLONE_CHECKLIST.md — final version

### Definition of Done

Any payment provider active in `store.config.ts` completes a real transaction in sandbox mode. CI is green. A developer unfamiliar with the project can follow `CLONE_CHECKLIST.md` and deliver a running storefront in under a day.

---

## Sprint 6 — Reference Storefront (Week 13–14) *(Optional but Recommended)*

**Goal:** A minimal but complete reference storefront that exercises every Core API endpoint. Used as the "closest previous project" when cloning for the first real client.

### Deliverables

- [ ] Homepage — featured collections, hero banner
- [ ] Products listing page — with filters (category, brand, price range), sort, pagination
- [ ] Product detail page — images, variant selector, add-to-cart
- [ ] Cart drawer/page
- [ ] Checkout page — address, shipping selection, coupon input, payment
- [ ] Order confirmation page
- [ ] Account pages — login, register, forgot/reset password, order history, addresses
- [ ] Accept invite page (CORE-OWNED)
- [ ] SEO: metadata, Open Graph, sitemap.xml, robots.txt
- [ ] Responsive (mobile-first)
- [ ] Google Analytics / Meta Pixel placeholder integration (env-var toggle)

> This storefront is deliberately generic — it should demonstrate competency, not impress a client visually. Each real client gets a completely custom storefront designed for their brand.

---

## Summary Timeline

| Sprint | Focus | Weeks |
|---|---|---|
| 0 | Foundation — schema, auth, tooling | 1–2 |
| 1 | Products, media, categories, brands, collections | 3–4 |
| 2 | Cart, checkout, Stripe payment *(highest risk)* | 5–6 |
| 3 | Orders, customers, reviews, auth flows | 7–8 |
| 4 | Analytics, settings, all emails, SDK | 9–10 |
| 5 | Regional payments, security, CI/CD, seed, docs | 11–12 |
| 6 | Reference storefront *(optional)* | 13–14 |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| bKash/Nagad API integration time | High | High | Start provider implementations in Sprint 2 in parallel with Stripe |
| Payment webhook testing in sandbox | Medium | High | Use provider sandbox environments + ngrok for local webhook testing |
| Schema change mid-project | Low | High | Complete schema in Sprint 0 — avoid mid-project migrations |
| Storefront SDK not covering a client's use case | Medium | Low | Ship SDK in Sprint 4; first real client will surface gaps before they cause delays |
| Vercel cron + Upstash Redis free tier limits | Low | Low | Monitor usage after first 2 clients; upgrade per-client if needed |
