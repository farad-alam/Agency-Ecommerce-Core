# Agency Ecommerce Core — Technical Architecture Plan

**Version:** v1.0 (Architecture)
**Model:** Template / Fork (clone-per-client, no shared runtime)
**Stack:** Next.js (App Router) · PostgreSQL · Prisma · Neon · Cloudinary · Tailwind CSS · shadcn/ui · Vercel

---

## 0. How to read this document

This is the follow-up to the Vision doc. That doc said *what* the Core is and *why*. This doc defines *how it's built*: repo structure, database schema, API contracts, dashboard pages, payment architecture, and the operational workflow around cloning and updating.

Because you've chosen the **template/fork model**, the single most important consequence is:

> Every client repo is independent the moment it's cloned. Core improvements do not propagate automatically. This doc includes a versioning and changelog system specifically to manage that tradeoff.

---

## 1. Repository Structure

One canonical repo: `agency-ecommerce-core`. Every client project is a fork/clone of this repo, renamed, with its storefront replaced.

```
agency-ecommerce-core/
├── CORE_VERSION                     # single line, e.g. "1.4.0" — bumped on every Core change
├── CHANGELOG.md                     # human-readable log of every Core change, tagged by severity
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (storefront)/            # CLIENT-OWNED — replaced per project
│   │   │   ├── page.tsx             # homepage
│   │   │   ├── products/
│   │   │   ├── collections/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/             # CORE-OWNED — never customized per client
│   │   │   ├── dashboard/
│   │   │   │   ├── products/
│   │   │   │   ├── orders/
│   │   │   │   ├── customers/
│   │   │   │   ├── inventory/
│   │   │   │   ├── coupons/
│   │   │   │   ├── shipping/
│   │   │   │   ├── media/
│   │   │   │   ├── analytics/
│   │   │   │   └── settings/
│   │   │   └── layout.tsx
│   │   └── api/                     # CORE-OWNED
│   │       ├── products/
│   │       ├── orders/
│   │       ├── customers/
│   │       ├── cart/
│   │       ├── checkout/
│   │       ├── webhooks/
│   │       │   └── payments/[provider]/route.ts
│   │       └── auth/
│   ├── core/                        # CORE-OWNED — business logic, framework-agnostic
│   │   ├── products/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── inventory/
│   │   ├── coupons/
│   │   ├── shipping/
│   │   ├── payments/
│   │   │   ├── adapter.ts           # PaymentProvider interface (see §6)
│   │   │   ├── providers/
│   │   │   │   ├── stripe.ts
│   │   │   │   ├── bkash.ts
│   │   │   │   ├── nagad.ts
│   │   │   │   └── paytabs.ts
│   │   ├── media/
│   │   ├── seo/
│   │   └── auth/
│   ├── components/
│   │   ├── ui/                      # shadcn/ui primitives — CORE-OWNED
│   │   ├── dashboard/                # CORE-OWNED
│   │   └── storefront/               # CLIENT-OWNED
│   ├── lib/
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── cloudinary.ts
│   │   └── env.ts                   # validated env (zod)
│   └── config/
│       └── store.config.ts          # per-client business config (see §8)
├── .env.example
├── CLONE_CHECKLIST.md               # step-by-step new-project setup
└── package.json
```

**Golden rule enforced structurally:** the only directories a developer should touch on a client project are `(storefront)/`, `components/storefront/`, `config/store.config.ts`, and `.env`. Everything else is Core. If a PR touches `core/`, `(dashboard)/`, or `api/` on a *client* repo, that's a signal something belongs back upstream instead — flag it rather than patch it locally.

---

## 2. Database Schema (Prisma) — Core Models

This is the actual data contract, not just a feature list. Each client gets their own Neon database, same schema.

```prisma
// prisma/schema.prisma (abridged — core entities only)

model Store {
  id            String   @id @default(cuid())
  name          String
  currency      String   @default("USD")
  locale        String   @default("en")
  timezone      String   @default("UTC")
  taxMode       TaxMode  @default(NONE)
  taxRate       Decimal? @db.Decimal(5, 2)
  createdAt     DateTime @default(now())
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String?
  role          Role     @default(CUSTOMER)   // CUSTOMER | STAFF | ADMIN
  name          String?
  phone         String?
  createdAt     DateTime @default(now())
  orders        Order[]
  addresses     Address[]
}

model Address {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  label       String?
  line1       String
  line2       String?
  city        String
  region      String?
  postalCode  String?
  country     String
  phone       String?
  isDefault   Boolean  @default(false)
}

model Product {
  id            String    @id @default(cuid())
  title         String
  slug          String    @unique
  description   String?
  status        ProductStatus @default(DRAFT) // DRAFT | ACTIVE | ARCHIVED
  brandId       String?
  brand         Brand?    @relation(fields: [brandId], references: [id])
  categories    CategoryOnProduct[]
  variants      ProductVariant[]
  media         Media[]
  seo           SeoMeta?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model ProductVariant {
  id            String   @id @default(cuid())
  productId     String
  product       Product  @relation(fields: [productId], references: [id])
  sku           String   @unique
  price         Decimal  @db.Decimal(10, 2)
  compareAtPrice Decimal? @db.Decimal(10, 2)
  options       Json     // e.g. { "size": "M", "color": "Red" }
  inventoryQty  Int      @default(0)
  weightGrams   Int?
  barcode       String?
}

model Category {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  parentId  String?
  parent    Category? @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  products  CategoryOnProduct[]
}

model CategoryOnProduct {
  productId   String
  categoryId  String
  product     Product  @relation(fields: [productId], references: [id])
  category    Category @relation(fields: [categoryId], references: [id])
  @@id([productId, categoryId])
}

model Brand {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  products Product[]
}

model Order {
  id             String       @id @default(cuid())
  orderNumber    String       @unique
  userId         String?
  user           User?        @relation(fields: [userId], references: [id])
  guestEmail     String?
  status         OrderStatus  @default(PENDING) // PENDING | PAID | FULFILLED | CANCELLED | REFUNDED | PARTIALLY_REFUNDED
  items          OrderItem[]
  subtotal       Decimal      @db.Decimal(10, 2)
  taxTotal       Decimal      @db.Decimal(10, 2) @default(0)
  shippingTotal  Decimal      @db.Decimal(10, 2) @default(0)
  discountTotal  Decimal      @db.Decimal(10, 2) @default(0)
  total          Decimal      @db.Decimal(10, 2)
  currency       String
  shippingAddress Json
  billingAddress  Json?
  paymentProvider String
  paymentStatus   PaymentStatus @default(UNPAID) // UNPAID | AUTHORIZED | PAID | FAILED | REFUNDED
  paymentRef      String?
  couponCode      String?
  notes           String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  refunds         Refund[]
  statusHistory   OrderStatusEvent[]
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id])
  variantId   String
  productTitle String  // snapshot at time of order — never join-read live product for history
  variantOptions Json
  sku         String
  price       Decimal  @db.Decimal(10, 2)
  quantity    Int
}

model OrderStatusEvent {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])
  status    OrderStatus
  note      String?
  createdAt DateTime @default(now())
}

model Refund {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])
  amount    Decimal  @db.Decimal(10, 2)
  reason    String?
  status    RefundStatus @default(PENDING) // PENDING | COMPLETED | FAILED
  createdAt DateTime @default(now())
}

model Coupon {
  id          String   @id @default(cuid())
  code        String   @unique
  type        CouponType // PERCENTAGE | FIXED | FREE_SHIPPING
  value       Decimal  @db.Decimal(10, 2)
  minSubtotal Decimal? @db.Decimal(10, 2)
  maxUses     Int?
  usedCount   Int      @default(0)
  startsAt    DateTime?
  expiresAt   DateTime?
  active      Boolean  @default(true)
}

model ShippingZone {
  id       String   @id @default(cuid())
  name     String
  regions  String[] // country/region codes
  rates    ShippingRate[]
}

model ShippingRate {
  id            String       @id @default(cuid())
  zoneId        String
  zone          ShippingZone @relation(fields: [zoneId], references: [id])
  name          String       // e.g. "Standard", "Express"
  price         Decimal      @db.Decimal(10, 2)
  minSubtotalForFree Decimal? @db.Decimal(10, 2)
}

model Review {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  userId    String?
  name      String
  rating    Int      // 1-5
  body      String?
  status    ReviewStatus @default(PENDING) // PENDING | APPROVED | REJECTED
  createdAt DateTime @default(now())
}

model Media {
  id          String   @id @default(cuid())
  productId   String?
  product     Product? @relation(fields: [productId], references: [id])
  url         String
  cloudinaryId String
  alt         String?
  position    Int      @default(0)
}

model SeoMeta {
  id          String   @id @default(cuid())
  productId   String   @unique
  product     Product  @relation(fields: [productId], references: [id])
  metaTitle   String?
  metaDescription String?
}

enum Role { CUSTOMER STAFF ADMIN }
enum ProductStatus { DRAFT ACTIVE ARCHIVED }
enum OrderStatus { PENDING PAID FULFILLED CANCELLED REFUNDED PARTIALLY_REFUNDED }
enum PaymentStatus { UNPAID AUTHORIZED PAID FAILED REFUNDED }
enum RefundStatus { PENDING COMPLETED FAILED }
enum CouponType { PERCENTAGE FIXED FREE_SHIPPING }
enum ReviewStatus { PENDING APPROVED REJECTED }
enum TaxMode { NONE FLAT_RATE REGIONAL }
```

**Key design decisions worth flagging explicitly:**

- **Variants are first-class**, not a JSON blob on Product. This was a gap in the original plan — size/color/SKU-level inventory needs its own table because inventory, pricing, and order line items all key off the variant, not the parent product.
- **OrderItem snapshots product data** (`productTitle`, `variantOptions`, `price`) at time of purchase. Never resolve historical order data through a live join to `Product` — products get renamed, repriced, deleted. This is a common mistake that corrupts order history.
- **Guest checkout supported natively** — `Order.userId` is optional, `guestEmail` covers the rest. Decide per-client in `store.config.ts` whether to force account creation.
- **Refunds are a separate model**, not just an `Order.status` flip — partial refunds are common and need their own audit trail.
- **Tax is intentionally minimal**: flat rate or simple regional rate. Anything more (VAT-by-line-item, multi-jurisdiction) is explicitly out of scope for V1 — don't build a tax engine.

---

## 3. API Layer

Route convention: `src/app/api/{resource}/route.ts` (collection) and `src/app/api/{resource}/[id]/route.ts` (item). All routes call into `src/core/{resource}/` — routes are thin, logic lives in Core so it's testable independent of Next.js.

| Resource | Methods | Notes |
|---|---|---|
| `/api/products` | GET, POST | GET supports `?category=&brand=&status=&search=` |
| `/api/products/[id]` | GET, PATCH, DELETE | |
| `/api/cart` | GET, POST, PATCH, DELETE | Session or user-scoped |
| `/api/checkout` | POST | Creates Order in PENDING, returns payment-provider session |
| `/api/orders` | GET | Dashboard + customer-facing (scoped by auth) |
| `/api/orders/[id]` | GET, PATCH | PATCH restricted to STAFF/ADMIN |
| `/api/orders/[id]/refund` | POST | STAFF/ADMIN only |
| `/api/customers` | GET, POST | Dashboard only |
| `/api/coupons` | GET, POST, PATCH, DELETE | Dashboard only |
| `/api/shipping/rates` | GET | Public — used at checkout |
| `/api/webhooks/payments/[provider]` | POST | Signature-verified, provider-specific |
| `/api/media/upload` | POST | Cloudinary signed upload |
| `/api/reviews` | GET, POST | POST is public (goes to PENDING) |
| `/api/reviews/[id]` | PATCH | Dashboard moderation |

**Auth:** every route under `/api/` (except public GETs and the checkout/cart flow) checks role via middleware. Use `next-auth` (or Auth.js) with a credentials + optional Google provider, session strategy JWT, role stored on the session token.

---

## 4. Dashboard Pages (Core-owned, identical across all clients)

```
/dashboard                 → overview: sales summary, recent orders, low-stock alerts
/dashboard/products        → list, filters, bulk actions
/dashboard/products/[id]   → edit, variants, media, SEO
/dashboard/products/new
/dashboard/categories
/dashboard/brands
/dashboard/orders          → list, status filter
/dashboard/orders/[id]     → detail, status update, refund action
/dashboard/customers
/dashboard/customers/[id]
/dashboard/inventory       → low stock, bulk quantity edit
/dashboard/coupons
/dashboard/shipping        → zones + rates
/dashboard/reviews         → moderation queue
/dashboard/media           → library view
/dashboard/analytics       → see §7, scoped down deliberately
/dashboard/settings
  /settings/store          → name, currency, locale, tax
  /settings/payments       → provider config
  /settings/team           → staff/admin users
```

This entire tree should render **zero client-specific code**. If a client needs a dashboard feature no other client has, that's almost always a sign it should be evaluated for Core (benefits everyone) rather than bolted onto one fork.

---

## 5. Storefront Boundary

Everything under `(storefront)/` and `components/storefront/` is disposable per client. It talks to Core exclusively through:

- The public API routes (`/api/products`, `/api/cart`, `/api/checkout`, etc.)
- Shared types exported from `src/core/*/types.ts`

No storefront component should import directly from `src/core/*` business logic files — only from the API layer or type definitions. This keeps the boundary real instead of aspirational.

---

## 6. Payment Layer — Adapter Pattern

Given your Bangladesh + Saudi focus, hardcoding Stripe is a mistake. Define one interface, implement per provider:

```ts
// src/core/payments/adapter.ts
export interface PaymentProvider {
  name: string;
  createCheckoutSession(order: Order): Promise<{ redirectUrl?: string; clientSecret?: string }>;
  verifyWebhook(req: Request): Promise<PaymentWebhookEvent>;
  refund(paymentRef: string, amount: number): Promise<RefundResult>;
}
```

Implement:
- `stripe.ts` — international / card-based clients
- `bkash.ts`, `nagad.ts` — Bangladesh
- `paytabs.ts` (or `mada` via a Saudi-compatible gateway) — Saudi/Gulf

Per-client `store.config.ts` selects which provider(s) are active. A client can enable more than one (e.g. bKash + card) — checkout UI reads available providers from config, not from hardcoded logic.

**This is the single highest-leverage piece of Core to get right early** — it's the part most likely to need a new implementation per region, and the adapter pattern means adding a new gateway never touches checkout, order, or webhook logic.

---

## 7. Analytics — Deliberately Scoped Down

Per the earlier flaw review: this is **not** a BI platform. V1 dashboard analytics = a handful of pre-computed widgets, queried directly from `Order`/`OrderItem`:

- Revenue (today / 7d / 30d)
- Order count + average order value
- Top 5 products by units sold
- Low stock count

Everything else (funnels, cohort analysis, ad attribution) is explicitly deferred to Google Analytics / Meta Pixel embedded in the storefront — not built into Core.

---

## 8. Per-Client Configuration

```ts
// src/config/store.config.ts
export const storeConfig = {
  name: "Client Name",
  currency: "BDT",
  locale: "en",
  taxMode: "FLAT_RATE",
  taxRate: 0,
  guestCheckoutEnabled: true,
  paymentProviders: ["bkash", "stripe"],
  shippingZones: [], // seeded via dashboard, not hardcoded
} satisfies StoreConfig;
```

This file, plus `.env`, is the *entire* diff a developer should need to touch for backend behavior on a new client. If configuring a new client requires editing files inside `core/`, that's a signal Core is missing a config hook — fix Core, don't special-case the client.

---

## 9. Template/Fork Workflow — Versioning & Update Strategy

This is the part that was missing from the original plan. Since forks diverge permanently at clone time, you need process discipline instead of automatic propagation.

**`CORE_VERSION`** — bumped on every Core change (semver: patch = bugfix, minor = new feature, major = breaking schema change).

**`CHANGELOG.md`** — every entry tagged:
- 🔴 `CRITICAL` — security/payment/data-integrity bug. Backport to all *active* client repos manually, same week.
- 🟡 `IMPROVEMENT` — worth backporting to active clients if low-risk (e.g. a dashboard UX fix). Judgment call per client.
- 🟢 `NEW-FEATURE` — only applies to future clones. Never backport unless a client specifically requests and pays for it.

**`CLONE_CHECKLIST.md`** — the literal step-by-step (this replaces steps 3–6 of the original Vision doc with something a junior dev can follow without asking questions):

```
1. Clone agency-ecommerce-core → rename to client-{name}
2. Record CORE_VERSION at clone time in the new repo's README
   ("Forked from Core v1.4.0 on 2026-07-26")
3. Create new Neon database, run `npx prisma migrate deploy`
4. Copy .env.example → .env, fill in: DB, Cloudinary, payment provider keys, auth secret
5. Edit src/config/store.config.ts
6. Delete /(storefront) contents, build client-specific storefront
7. Run `npx prisma db seed` for starter categories/admin user
8. Configure dashboard: store settings → shipping zones → payment provider → import products
9. Deploy to Vercel (new project, not a branch of an existing one)
10. Smoke test: create test order end-to-end through the selected payment provider's sandbox
```

Recording the Core version at fork time means that six months later, when you're deciding whether to backport a fix, you know exactly how far that client has drifted and can diff against that specific tag.

---

## 10. Testing Strategy (minimum viable, not exhaustive)

Given that a Core bug ships into every future clone, the payment and order flow specifically need coverage before this becomes your standard:

- **Unit tests** (Vitest) for `src/core/*` — especially order total calculation, coupon logic, inventory decrement on order, refund math.
- **Integration test** for the full checkout flow against each payment provider's sandbox/test mode.
- **No requirement** for storefront UI test coverage — that's disposable per client, not worth the investment.

---

## 11. Infrastructure & Cost Model

- **Neon**: one project per client (free tier covers early clients; upgrade per-client as traffic grows). Keep client DB credentials in that client's own `.env`, never shared.
- **Cloudinary**: recommend a shared agency account with per-client folder prefixes (`client-name/products/...`) rather than a new account per client, to avoid free-tier fragmentation — revisit if a client's media volume gets large.
- **Vercel**: one project per client, connected to that client's own GitHub repo. Client can be handed ownership of the Vercel project at handoff if desired.

---

## 12. What This Plan Deliberately Does Not Include

Consistent with the V1 scope decisions from the Vision doc — no multi-tenancy, no subscription billing, no loyalty/gift cards, no ERP/POS hooks, no AI recommendations. If any of these come up as a recurring client request, they get evaluated as a *new Core version*, not a one-off client patch.

---

## Suggested Next Steps

1. Scaffold the repo structure above and get `prisma migrate dev` running against a local/dev Neon DB.
2. Build the payment adapter interface + one real implementation (Stripe is fastest to prototype with) before wiring up bKash/PayTabs, so checkout logic is proven before adding regional complexity.
3. Write `CLONE_CHECKLIST.md` and `CHANGELOG.md` as real files in the repo from day one, not just as this document's appendix — they're operational tools, not documentation.
