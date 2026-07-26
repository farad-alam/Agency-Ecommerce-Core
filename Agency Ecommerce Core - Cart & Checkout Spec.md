# Agency Ecommerce Core — Cart & Checkout Flow Spec

**Version:** v1.0 (Cart & Checkout)
**Parent Document:** Architecture Plan v1.0
**Depends On:** Auth Design Spec v1.0

---

## 0. How to read this document

The Architecture doc identified `/api/cart` as "session or user-scoped" but left the schema, session model, and cart lifecycle unspecified. This document fills every gap a developer needs to implement cart and checkout without open questions.

**Scope of this spec:**
- Cart schema (the missing Prisma models)
- Cart session identity — how we know whose cart is whose
- Cart API (every endpoint)
- Pricing engine — how subtotals, tax, shipping, and coupons are calculated
- Full checkout flow sequence (cart → order → payment → confirmation)
- Payment adapter integration per provider
- Webhook handling (payment confirmation, failure)
- Inventory decrement timing and race condition protection
- File map

**Not in scope:** payment provider credential setup, storefront UI design.

---

## 1. Cart Schema — Missing Prisma Models

Add to `prisma/schema.prisma`:

```prisma
model Cart {
  id          String     @id @default(cuid())
  userId      String?    @unique          // null for guest carts
  user        User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId   String?    @unique          // cookie-based ID for guest carts
  items       CartItem[]
  couponCode  String?                     // applied coupon (validated, not permanently locked)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  expiresAt   DateTime                    // 30 days from last update
}

model CartItem {
  id        String         @id @default(cuid())
  cartId    String
  cart      Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  quantity  Int
  addedAt   DateTime       @default(now())

  @@unique([cartId, variantId])            // one row per variant per cart — quantity is updated, not duplicated
}
```

### Key design decisions

- **Server-side cart, not localStorage.** Guest carts exist in the DB, keyed by a random `sessionId` stored in a cookie. This gives us: (a) consistent cart state across devices, (b) cart merging on login, (c) ability to recover abandoned carts in the future.
- **`userId @unique`** — one active cart per user. Enforced at DB level.
- **`sessionId @unique`** — one active cart per browser session.
- **`CartItem @@unique([cartId, variantId])`** — adding the same variant twice increments quantity, never creates a second row. Enforced at DB level.
- **`expiresAt`** — carts expire after 30 days of inactivity. A background cleanup job (or Vercel cron) deletes expired carts. This prevents the DB from accumulating millions of abandoned guest carts.
- **Cart does NOT store computed prices.** Prices are always read live from `ProductVariant.price` when the cart is fetched. This prevents stale pricing bugs if a product is repriced while an item sits in a cart.
- **Coupon stored on Cart but not locked.** It is re-validated on every cart read and at checkout time. A coupon that expires or gets deactivated after being applied will be caught and rejected at checkout.

---

## 2. Cart Session Identity

This is the most nuanced piece of the cart system — how we know whose cart to read/write for any given request.

### Identity resolution priority

```
1. Authenticated user (JWT session exists)
   → Cart identified by userId
   → If no cart exists for this userId, create one

2. Guest with sessionId cookie
   → Cart identified by sessionId
   → If no cart exists for this sessionId, create one

3. New guest (no cookie, no session)
   → Generate new sessionId (crypto.randomUUID())
   → Set as httpOnly cookie (30-day maxAge)
   → Create new Cart with this sessionId
```

### Cart session cookie

```
Name:     cart-session-id
Value:    random UUID (crypto.randomUUID())
HttpOnly: true       (not accessible from JavaScript)
Secure:   true       (HTTPS only in production)
SameSite: Lax
MaxAge:   30 days
Path:     /
```

### Cart merge on login

When a guest logs in, their guest cart must be merged into their account cart:

```
1. Guest has cart (sessionId = "abc123") with 2 items
2. Guest logs in → Auth.js issues JWT
3. On the FIRST authenticated request to /api/cart:
   a. Look up guest cart by sessionId cookie
   b. Look up user cart by userId
   c. If both exist:
      - For each item in guest cart:
        - If variant already in user cart → add quantities together (cap at available inventory)
        - If variant not in user cart → move the item to user cart
      - Delete the guest cart
   d. If only guest cart exists: update cart.userId = session.userId, clear cart.sessionId
   e. If only user cart exists: nothing to merge
4. Clear the sessionId cookie
```

This merge happens in `src/core/cart/merge.ts` and is called by the cart resolver helper, not by Auth.js directly.

---

## 3. Cart Core Helpers

### File: `src/core/cart/resolver.ts`

The cart resolver is the single function that every API route calls to get or create the cart for the current request. It handles identity, merge, and creation.

```ts
// src/core/cart/resolver.ts

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mergeGuestCart } from "./merge";

export async function resolveCart() {
  const session = await auth();
  const cookieStore = cookies();

  if (session?.user?.id) {
    // Authenticated user
    const userId = session.user.id;
    const sessionId = cookieStore.get("cart-session-id")?.value;

    // Merge guest cart if present
    if (sessionId) {
      await mergeGuestCart(userId, sessionId);
      // Cookie cleared inside mergeGuestCart via cookies().delete()
    }

    // Get or create user cart
    let cart = await db.cart.findUnique({ where: { userId }, include: { items: { include: { variant: { include: { product: true } } } } } });
    if (!cart) {
      cart = await db.cart.create({
        data: { userId, expiresAt: thirtyDaysFromNow() },
        include: { items: { include: { variant: { include: { product: true } } } } },
      });
    }
    return cart;
  }

  // Guest
  let sessionId = cookieStore.get("cart-session-id")?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set("cart-session-id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  let cart = await db.cart.findUnique({ where: { sessionId }, include: { items: { include: { variant: { include: { product: true } } } } } });
  if (!cart) {
    cart = await db.cart.create({
      data: { sessionId, expiresAt: thirtyDaysFromNow() },
      include: { items: { include: { variant: { include: { product: true } } } } },
    });
  }

  return cart;
}

function thirtyDaysFromNow() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}
```

---

## 4. Pricing Engine

All price calculations are centralised in `src/core/cart/pricing.ts`. This is called by both the cart API (to display totals) and the checkout API (to confirm totals before creating the order). **Never trust client-sent totals.**

```ts
// src/core/cart/pricing.ts

import type { Cart, CartItem, ProductVariant, ShippingRate, Coupon } from "@prisma/client";
import { storeConfig } from "@/config/store.config";

export interface CartTotals {
  subtotal: number;        // sum of (variant.price × quantity) for all items
  discountTotal: number;   // reduction from coupon
  taxTotal: number;        // tax on (subtotal - discountTotal)
  shippingTotal: number;   // shipping rate for selected method
  total: number;           // subtotal - discountTotal + taxTotal + shippingTotal
  couponError?: string;    // if applied coupon is now invalid
}

type CartItemWithVariant = CartItem & {
  variant: ProductVariant;
};

export function calculateCartTotals(
  items: CartItemWithVariant[],
  coupon: Coupon | null,
  shippingRate: ShippingRate | null
): CartTotals {
  // 1. Subtotal — always from DB prices, never from client
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0
  );

  // 2. Coupon discount
  let discountTotal = 0;
  let couponError: string | undefined;

  if (coupon) {
    if (!coupon.active) {
      couponError = "This coupon is no longer active.";
    } else if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      couponError = "This coupon has expired.";
    } else if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      couponError = "This coupon has reached its usage limit.";
    } else if (coupon.minSubtotal && subtotal < Number(coupon.minSubtotal)) {
      couponError = `Minimum order of ${coupon.minSubtotal} required for this coupon.`;
    } else {
      if (coupon.type === "PERCENTAGE") {
        discountTotal = (subtotal * Number(coupon.value)) / 100;
      } else if (coupon.type === "FIXED") {
        discountTotal = Math.min(Number(coupon.value), subtotal); // never go negative
      } else if (coupon.type === "FREE_SHIPPING") {
        // Discount is applied to shipping, not subtotal — handled below
      }
    }
  }

  // 3. Tax — applied on discounted subtotal
  const taxableAmount = subtotal - discountTotal;
  let taxTotal = 0;
  if (storeConfig.taxMode === "FLAT_RATE" && storeConfig.taxRate > 0) {
    taxTotal = (taxableAmount * storeConfig.taxRate) / 100;
  }

  // 4. Shipping
  let shippingTotal = 0;
  if (shippingRate) {
    const isFreeBySubtotal =
      shippingRate.minSubtotalForFree != null &&
      subtotal >= Number(shippingRate.minSubtotalForFree);
    const isFreeByFreeCoupon = coupon?.type === "FREE_SHIPPING" && !couponError;

    if (!isFreeBySubtotal && !isFreeByFreeCoupon) {
      shippingTotal = Number(shippingRate.price);
    }
  }

  // 5. Total
  const total = subtotal - discountTotal + taxTotal + shippingTotal;

  return {
    subtotal: round(subtotal),
    discountTotal: round(discountTotal),
    taxTotal: round(taxTotal),
    shippingTotal: round(shippingTotal),
    total: round(total),
    couponError,
  };
}

// Round to 2 decimal places — avoid floating point drift in financial calculations
function round(n: number) {
  return Math.round(n * 100) / 100;
}
```

### Key decisions

- **All prices sourced from DB.** The client sends variant IDs and quantities only. Prices are always fetched from `ProductVariant.price`.
- **Coupons re-validated on every call.** If a coupon was valid when applied but became invalid (expired, deactivated, hit usage limit), the error is surfaced to the customer before checkout — not silently applied at a wrong amount.
- **Tax applied to discounted subtotal.** Tax is calculated on `subtotal - discount`, not on `subtotal`. This is the correct approach for most tax jurisdictions.
- **FREE_SHIPPING coupon offsets shipping total, not subtotal.** It does not create a discount line item.
- **No floating point in the DB.** All amounts stored as `Decimal` in Prisma (maps to PostgreSQL `NUMERIC`). The pricing engine returns JavaScript numbers rounded to 2dp for display — the final values written to the Order model are Prisma Decimal-compatible strings.

---

## 5. Cart API

All routes call into `src/core/cart/` — routes are thin.

### `GET /api/cart`

Returns the cart for the current session (authenticated or guest). Creates a cart if one doesn't exist.

```ts
// Response (200)
{
  "id": "cart_abc123",
  "items": [
    {
      "id": "item_xyz",
      "variantId": "variant_123",
      "quantity": 2,
      "variant": {
        "id": "variant_123",
        "sku": "SHIRT-RED-M",
        "price": "29.99",
        "compareAtPrice": "39.99",
        "options": { "color": "Red", "size": "M" },
        "inventoryQty": 15,
        "product": {
          "id": "prod_abc",
          "title": "Classic T-Shirt",
          "slug": "classic-t-shirt",
          "media": [{ "url": "...", "alt": "..." }]  // first image only
        }
      }
    }
  ],
  "couponCode": "SAVE10",
  "totals": {
    "subtotal": 59.98,
    "discountTotal": 6.00,
    "taxTotal": 2.70,
    "shippingTotal": 0,         // null if no shipping method selected yet
    "total": 56.68,
    "couponError": null
  },
  "itemCount": 2                 // total units (sum of quantities)
}
```

**Implementation:**

```
1. resolveCart() — get or create cart, merge guest if logging in
2. Fetch applied coupon from DB if cart.couponCode is set
3. calculateCartTotals(items, coupon, null) — no shipping rate at cart stage
4. Return cart + totals
5. Refresh cart.expiresAt (rolling 30-day window on every access)
```

---

### `POST /api/cart/items`

Add an item to the cart.

```ts
// Request
{ "variantId": "variant_123", "quantity": 1 }

// Response (200) — returns updated cart (same shape as GET)

// Error responses
// 400 — invalid variantId, quantity < 1
// 404 — variant not found or product not ACTIVE
// 409 — insufficient inventory (quantity requested > inventoryQty)
```

**Flow:**

```
1. Validate request (Zod)
2. resolveCart()
3. Fetch variant — must exist and product must be ACTIVE
4. Check inventory: (existing cartItem.quantity + requested quantity) <= variant.inventoryQty
   → 409 if insufficient
5. Upsert CartItem: if variantId already in cart, increment quantity; else create new row
6. Update cart.updatedAt and cart.expiresAt
7. Return updated cart with totals
```

---

### `PATCH /api/cart/items/[itemId]`

Update quantity of a specific cart item.

```ts
// Request
{ "quantity": 3 }      // 0 = remove the item

// Response (200) — updated cart

// Error responses
// 404 — item not found in this cart
// 409 — requested quantity > inventoryQty
```

**Flow:**

```
1. Validate request
2. resolveCart() — verify itemId belongs to this cart
3. If quantity === 0: delete CartItem
4. Else: check inventory, update CartItem.quantity
5. Return updated cart with totals
```

---

### `DELETE /api/cart/items/[itemId]`

Remove a specific item from the cart.

```ts
// Response (200) — updated cart
// Error: 404 if item not in this cart
```

---

### `POST /api/cart/coupon`

Apply or validate a coupon code.

```ts
// Request
{ "code": "SAVE10" }

// Response (200)
{
  "coupon": { "code": "SAVE10", "type": "PERCENTAGE", "value": "10.00" },
  "totals": { ... }   // recalculated totals with discount applied
}

// Error responses
// 404 — coupon code not found
// 400 — coupon not active, expired, usage limit reached, minimum not met
```

**Flow:**

```
1. resolveCart()
2. Find coupon by code in DB — 404 if not found
3. Validate coupon (active, dates, usage limit, minSubtotal) — 400 with message if invalid
4. Set cart.couponCode = code
5. Recalculate and return totals
```

---

### `DELETE /api/cart/coupon`

Remove the applied coupon.

```ts
// Response (200) — updated totals with no discount
```

---

### `DELETE /api/cart`

Clear all items from the cart (but don't delete the cart itself).

```ts
// Response (200) — empty cart
```

---

## 6. Checkout Flow — Full Sequence

```
Storefront                  API (Core)                DB / External
    │                          │                          │
    │  1. GET /api/cart         │                          │
    │◄──────────────────────────│                          │
    │  (shows items + totals)   │                          │
    │                          │                          │
    │  2. GET /api/shipping/    │                          │
    │     rates?country=BD      │                          │
    │◄──────────────────────────│                          │
    │  (available rates)        │                          │
    │                          │                          │
    │  Customer fills address   │                          │
    │  + selects shipping rate  │                          │
    │                          │                          │
    │  3. POST /api/checkout    │                          │
    │──────────────────────────►│                          │
    │                          │ Validate cart             │
    │                          │ Validate inventory        │
    │                          │ Re-calculate totals       │
    │                          │ Validate coupon           │
    │                          │──────────────────────────►│
    │                          │ Create Order (PENDING)    │
    │                          │ Decrement inventory       │
    │                          │──────────────────────────►│
    │                          │ Call PaymentProvider      │
    │                          │   .createCheckoutSession()│
    │                          │                          │
    │◄──────────────────────────│                          │
    │  { redirectUrl OR         │                          │
    │    clientSecret }         │                          │
    │                          │                          │
    │  (redirect to payment     │                          │
    │   gateway OR show         │                          │
    │   card form)              │                          │
    │                          │                          │
    │         ── Customer completes / fails payment ──    │
    │                          │                          │
    │                          │ 4. POST /api/webhooks/   │
    │                          │    payments/[provider]   │
    │                          │◄─────────────────────────│
    │                          │ Verify signature          │
    │                          │ Update Order.paymentStatus│
    │                          │ Update Order.status       │
    │                          │ Increment coupon.usedCount│
    │                          │ Clear cart                │
    │                          │ Send confirmation email   │
    │                          │──────────────────────────►│
    │                          │                          │
    │  5. Redirect to           │                          │
    │     /order/[orderNumber]  │                          │
    │◄──────────────────────────│                          │
```

---

## 7. Checkout API — `POST /api/checkout`

This is the most critical endpoint. Every validation runs server-side. The client sends intent; the server confirms everything.

### Request

```ts
{
  "shippingAddress": {
    "name": "John Doe",
    "line1": "123 Main St",
    "line2": null,
    "city": "Dhaka",
    "region": "Dhaka Division",
    "postalCode": "1215",
    "country": "BD",
    "phone": "+8801711111111"
  },
  "billingAddress": null,        // null = same as shipping
  "shippingRateId": "rate_abc",
  "paymentProvider": "bkash",    // must be in storeConfig.paymentProviders
  "couponCode": "SAVE10",        // optional — also on cart, sent for confirmation
  "notes": "Leave at door",      // optional
  "guestEmail": "guest@ex.com"   // required if not authenticated
}
```

### Response (201)

```ts
// Redirect-based payment (bKash, PayTabs, Nagad)
{
  "orderId": "order_abc",
  "orderNumber": "ORD-10042",
  "paymentMethod": "redirect",
  "redirectUrl": "https://payment.gateway.com/session/xyz"
}

// Client-side payment (Stripe card)
{
  "orderId": "order_abc",
  "orderNumber": "ORD-10042",
  "paymentMethod": "client_secret",
  "clientSecret": "pi_xxx_secret_yyy"
}
```

### Validation Checklist (in order)

```
1. Guest checkout gate
   - If not authenticated AND storeConfig.guestCheckoutEnabled === false → 401
   - If not authenticated AND guestEmail missing → 400

2. Cart validation
   - resolveCart() — must have at least 1 item
   - All items must have ACTIVE products
   - Re-fetch all variants from DB — do NOT trust cached cart prices

3. Inventory validation (pre-decrement check)
   - For each CartItem: variant.inventoryQty >= item.quantity
   - If any item is out of stock → 409 with details of which items failed
   - This is a soft check — race condition protection happens at decrement (§9)

4. Shipping validation
   - shippingRateId must exist in DB
   - ShippingRate.zone.regions must include the shipping country
   - 400 if invalid or doesn't cover the destination

5. Payment provider validation
   - paymentProvider must be in storeConfig.paymentProviders
   - 400 if unsupported

6. Coupon re-validation (if provided)
   - Re-run full coupon validation (same as POST /api/cart/coupon)
   - If invalid: 400 with coupon error message — do NOT silently ignore it

7. Price recalculation (server-side, authoritative)
   - calculateCartTotals(items, coupon, shippingRate)
   - These are the values written to the Order — never use client-sent totals
```

### Order Creation Flow

```ts
// src/core/checkout/create-order.ts (pseudocode)

async function createOrder(input: CheckoutInput, cart: Cart, totals: CartTotals) {
  // Generate human-readable order number
  const orderNumber = await generateOrderNumber(); // e.g. "ORD-10042" — see §7.1

  // Use a transaction — all-or-nothing
  return await db.$transaction(async (tx) => {
    // 1. Create the Order
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: input.userId ?? null,
        guestEmail: input.guestEmail ?? null,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentProvider: input.paymentProvider,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        shippingTotal: totals.shippingTotal,
        discountTotal: totals.discountTotal,
        total: totals.total,
        currency: storeConfig.currency,
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress ?? input.shippingAddress,
        couponCode: input.couponCode ?? null,
        notes: input.notes ?? null,
      },
    });

    // 2. Create OrderItems (snapshot of product data at purchase time)
    await tx.orderItem.createMany({
      data: cart.items.map((item) => ({
        orderId: order.id,
        variantId: item.variantId,
        productTitle: item.variant.product.title,   // snapshot
        variantOptions: item.variant.options,         // snapshot
        sku: item.variant.sku,                        // snapshot
        price: item.variant.price,                    // snapshot — NOT live price
        quantity: item.quantity,
      })),
    });

    // 3. Create initial status history event
    await tx.orderStatusEvent.create({
      data: { orderId: order.id, status: "PENDING", note: "Order created" },
    });

    // 4. Decrement inventory (see §9 for race condition handling)
    for (const item of cart.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { inventoryQty: { decrement: item.quantity } },
      });
    }

    return order;
  });
}
```

### 7.1 Order Number Generation

Human-readable, sequential-ish order numbers. Use a padded auto-increment from the DB.

```ts
async function generateOrderNumber(): Promise<string> {
  // Use the total Order count + a base to avoid "ORD-1"
  const count = await db.order.count();
  const num = count + 1000;  // starts at ORD-1000
  return `ORD-${num}`;
}
```

> **Note:** This is not collision-safe under high concurrency, but for typical agency client volumes (< 1,000 orders/day) it is more than sufficient for V1. Under the `db.$transaction`, the count and create happen atomically. Revisit for high-volume clients.

---

## 8. Payment Provider Integration

### Adapter Interface (from Architecture doc §6)

```ts
// src/core/payments/adapter.ts

export interface PaymentProvider {
  name: string;

  // Called during POST /api/checkout after order creation
  // Returns either a redirect URL (gateway-hosted) or a client secret (Stripe Elements)
  createCheckoutSession(order: OrderWithItems, returnUrl: string): Promise<{
    redirectUrl?: string;
    clientSecret?: string;
    providerRef?: string;     // store on Order.paymentRef for webhook matching
  }>;

  // Called when a webhook arrives at /api/webhooks/payments/[provider]
  verifyWebhook(req: Request): Promise<PaymentWebhookEvent>;

  // Called from dashboard when staff triggers a refund
  refund(paymentRef: string, amountCents: number): Promise<RefundResult>;
}

export interface PaymentWebhookEvent {
  type: "payment.succeeded" | "payment.failed" | "refund.completed";
  orderId?: string;          // if provider passes our order ID through
  paymentRef: string;        // provider's transaction reference
  amountPaid?: number;       // in the currency's smallest unit
  currency?: string;
  raw: unknown;              // original payload — stored for debugging
}

export interface RefundResult {
  success: boolean;
  refundRef: string;
  error?: string;
}
```

### Provider Registry

```ts
// src/core/payments/registry.ts

import { StripeProvider } from "./providers/stripe";
import { BkashProvider } from "./providers/bkash";
import { NagadProvider } from "./providers/nagad";
import { PayTabsProvider } from "./providers/paytabs";
import { storeConfig } from "@/config/store.config";
import type { PaymentProvider } from "./adapter";

const allProviders: Record<string, PaymentProvider> = {
  stripe: new StripeProvider(),
  bkash: new BkashProvider(),
  nagad: new NagadProvider(),
  paytabs: new PayTabsProvider(),
};

export function getProvider(name: string): PaymentProvider {
  if (!storeConfig.paymentProviders.includes(name)) {
    throw new Error(`Payment provider "${name}" is not enabled for this store.`);
  }
  const provider = allProviders[name];
  if (!provider) throw new Error(`Payment provider "${name}" is not implemented.`);
  return provider;
}

export function getEnabledProviders(): PaymentProvider[] {
  return storeConfig.paymentProviders.map(getProvider);
}
```

### Provider Implementation Pattern (Stripe example)

```ts
// src/core/payments/providers/stripe.ts

import Stripe from "stripe";
import type { PaymentProvider, PaymentWebhookEvent, RefundResult } from "../adapter";
import type { Order } from "@prisma/client";

export class StripeProvider implements PaymentProvider {
  name = "stripe";
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

  async createCheckoutSession(order: OrderWithItems, returnUrl: string) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(Number(order.total) * 100),   // convert to cents
      currency: order.currency.toLowerCase(),
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      providerRef: paymentIntent.id,
    };
  }

  async verifyWebhook(req: Request): Promise<PaymentWebhookEvent> {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;
    const event = this.stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      return {
        type: "payment.succeeded",
        paymentRef: pi.id,
        orderId: pi.metadata.orderId,
        amountPaid: pi.amount_received,
        currency: pi.currency,
        raw: event,
      };
    }
    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      return {
        type: "payment.failed",
        paymentRef: pi.id,
        orderId: pi.metadata.orderId,
        raw: event,
      };
    }

    throw new Error(`Unhandled Stripe webhook event type: ${event.type}`);
  }

  async refund(paymentRef: string, amountCents: number): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentRef,
      amount: amountCents,
    });
    return { success: refund.status === "succeeded", refundRef: refund.id };
  }
}
```

---

## 9. Webhook Handler — `POST /api/webhooks/payments/[provider]`

This is where payment results are received and order status is updated. It must be fast, idempotent, and signature-verified.

```ts
// src/app/api/webhooks/payments/[provider]/route.ts

import { getProvider } from "@/core/payments/registry";
import { db } from "@/lib/db";
import { sendEmail } from "@/core/email/send";   // from Email Spec
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { provider: string } }) {
  const provider = getProvider(params.provider);

  let event;
  try {
    event = await provider.verifyWebhook(req);
  } catch {
    // Invalid signature — reject immediately
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  // Find the order — by orderId in metadata (preferred) or by paymentRef
  const order = await db.order.findFirst({
    where: event.orderId
      ? { id: event.orderId }
      : { paymentRef: event.paymentRef },
  });

  if (!order) {
    // Log and return 200 — don't make the provider retry (it may be a test event)
    console.warn("Webhook received for unknown order:", event.paymentRef);
    return NextResponse.json({ received: true });
  }

  // Idempotency: if already in final state, ignore
  if (order.paymentStatus === "PAID" || order.paymentStatus === "FAILED") {
    return NextResponse.json({ received: true });
  }

  if (event.type === "payment.succeeded") {
    await db.$transaction(async (tx) => {
      // Update order
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "PAID",
          paymentRef: event.paymentRef,
        },
      });

      // Add status history event
      await tx.orderStatusEvent.create({
        data: { orderId: order.id, status: "PAID", note: "Payment confirmed via webhook" },
      });

      // Increment coupon usage
      if (order.couponCode) {
        await tx.coupon.update({
          where: { code: order.couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear the cart
      if (order.userId) {
        const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
          await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
        }
      }
      // Guest cart cleanup: guest cookies expire naturally (30 days)
      // No server action needed — the cart will be picked up by next cleanup job
    });

    // Send order confirmation email (outside transaction — failure here doesn't roll back order)
    await sendEmail({
      to: order.guestEmail ?? (await db.user.findUnique({ where: { id: order.userId! } }))?.email ?? "",
      template: "order-confirmation",
      data: { orderNumber: order.orderNumber, orderTotal: order.total },
    }).catch(console.error);  // log but don't throw — email failure must not affect order status

  } else if (event.type === "payment.failed") {
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED" },
      });
      await tx.orderStatusEvent.create({
        data: { orderId: order.id, status: "PENDING", note: "Payment failed — awaiting retry" },
      });

      // Restore inventory (payment failed, items should be available again)
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { inventoryQty: { increment: item.quantity } },
        });
      }
    });
  }

  // Always return 200 — if we return 4xx/5xx, the provider will retry
  return NextResponse.json({ received: true });
}
```

### Webhook security rules

- **Always verify signature first.** Never process a webhook payload before verifying it came from the real provider.
- **Always return 200.** Even on errors after signature verification. Log the error, don't cause retries for bugs in our processing code.
- **Idempotency.** If the same webhook fires twice (providers retry on timeout), check the current order state before acting. `if (paymentStatus === "PAID") return 200 immediately`.
- **Keep the route on App Router config `export const runtime = "nodejs"`** — Stripe signature verification requires reading the raw body, which needs Node.js runtime, not Edge.

---

## 10. Inventory Decrement — Race Condition Protection

The biggest inventory risk: two customers checkout the last unit simultaneously.

### Strategy: Decrement-then-check

```ts
// Inside db.$transaction in create-order.ts

// Decrement first, then verify the result didn't go negative
const updated = await tx.productVariant.update({
  where: { id: item.variantId },
  data: { inventoryQty: { decrement: item.quantity } },
  select: { inventoryQty: true },
});

if (updated.inventoryQty < 0) {
  // Rollback the transaction and surface the error
  throw new Error(`Insufficient inventory for variant ${item.variantId}`);
}
// If the transaction rolls back, Prisma restores inventoryQty automatically
```

**Why this works:** PostgreSQL executes all operations in a `$transaction` with serializable isolation. The decrement is atomic — no second concurrent transaction can read the same row between our decrement and our check.

**Inventory policy configurable via `store.config.ts`:**

```ts
auth: {
  // ...
},
inventory: {
  // Allow overselling (e.g. made-to-order products)
  allowOversell: false,
  // When to decrement: "on_checkout" (default) or "on_payment"
  decrementOn: "on_checkout",
}
```

- **`on_checkout` (default):** Inventory decrements when the Order is created (PENDING state), even before payment is confirmed. If payment fails, inventory is restored in the webhook handler. This prevents overselling.
- **`on_payment`:** Inventory only decrements after webhook confirms payment. Risk: two customers can checkout the same last item simultaneously — the second payment succeeds but inventory goes to -1. Only use this for made-to-order or print-on-demand products.

---

## 11. Storefront — Checkout Return Handling

After payment, the gateway redirects the customer back to the storefront. The return URL is passed by the checkout API.

```
Success: {SITE_URL}/order/[orderNumber]?status=success
Failure: {SITE_URL}/checkout?error=payment_failed
Cancel:  {SITE_URL}/checkout?error=cancelled
```

**Important:** The `/order/[orderNumber]` page should NOT rely on the `?status=success` query param to determine if the order was paid. Always fetch the order from the API and use `Order.paymentStatus === "PAID"` as the source of truth. Query params can be tampered with.

```ts
// (storefront)/order/[orderNumber]/page.tsx (client-owned UI)
// Fetch from API: GET /api/orders?orderNumber=ORD-10042
// Display based on actual order.paymentStatus from the DB
```

---

## 12. Shipping Rates API — `GET /api/shipping/rates`

Used at checkout to display available shipping options for the customer's destination.

```ts
// Request
GET /api/shipping/rates?country=BD&subtotal=1500

// Response (200)
{
  "rates": [
    {
      "id": "rate_abc",
      "name": "Standard Delivery",
      "price": "60.00",
      "isFree": false
    },
    {
      "id": "rate_xyz",
      "name": "Express Delivery",
      "price": "120.00",
      "isFree": false
    }
  ]
}
```

**Flow:**

```
1. Find ShippingZones where regions array contains the requested country
2. For each matching zone, return its ShippingRates
3. Apply free shipping threshold: if subtotal >= rate.minSubtotalForFree → isFree: true
4. If no zones cover the destination → return empty rates array
   (storefront should display "Shipping not available to your location")
```

---

## 13. Cart Cleanup — Expired Cart Job

Add to Vercel cron (configured in `vercel.json`):

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-carts",
      "schedule": "0 3 * * *"   // 3am daily
    }
  ]
}
```

```ts
// src/app/api/cron/cleanup-carts/route.ts

import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron, not an external actor
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db.cart.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return NextResponse.json({ deleted: result.count });
}
```

Add `CRON_SECRET` to `.env.example`.

---

## 14. File Map

```
src/
├── core/
│   ├── cart/
│   │   ├── resolver.ts          # resolveCart() — session identity + cart creation
│   │   ├── merge.ts             # mergeGuestCart() — login cart merge
│   │   ├── pricing.ts           # calculateCartTotals() — pricing engine
│   │   └── types.ts             # CartWithItems, CartTotals, etc.
│   ├── checkout/
│   │   ├── create-order.ts      # createOrder() — order + items + inventory decrement
│   │   ├── order-number.ts      # generateOrderNumber()
│   │   └── types.ts             # CheckoutInput, CheckoutResult
│   └── payments/
│       ├── adapter.ts           # PaymentProvider interface
│       ├── registry.ts          # getProvider(), getEnabledProviders()
│       └── providers/
│           ├── stripe.ts
│           ├── bkash.ts
│           ├── nagad.ts
│           └── paytabs.ts
├── app/
│   └── api/
│       ├── cart/
│       │   ├── route.ts                        # GET (read cart)
│       │   ├── items/route.ts                  # POST (add item)
│       │   ├── items/[itemId]/route.ts          # PATCH (update qty), DELETE (remove)
│       │   ├── coupon/route.ts                  # POST (apply), DELETE (remove)
│       │   └── clear/route.ts                   # DELETE (clear all items)
│       ├── checkout/
│       │   └── route.ts                         # POST (create order + init payment)
│       ├── shipping/
│       │   └── rates/route.ts                   # GET (available rates by country)
│       ├── orders/
│       │   ├── route.ts                         # GET (list — scoped by auth)
│       │   └── [id]/route.ts                    # GET (detail), PATCH (status — staff)
│       └── webhooks/
│           └── payments/
│               └── [provider]/route.ts          # POST — payment gateway callbacks
│               └── route.ts                     # GET — Vercel cron cart cleanup
├── prisma/
│   └── schema.prisma            # Add Cart, CartItem models (§1)
└── config/
    └── store.config.ts          # Add inventory.allowOversell, inventory.decrementOn
```

---

## 15. Environment Variables

Add to `.env.example`:

```env
# Stripe (if enabled)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# bKash (if enabled)
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_SANDBOX=true

# Nagad (if enabled)
NAGAD_MERCHANT_ID=
NAGAD_MERCHANT_PRIVATE_KEY=
NAGAD_SANDBOX=true

# PayTabs (if enabled)
PAYTABS_PROFILE_ID=
PAYTABS_SERVER_KEY=
PAYTABS_REGION=SAU

# Cron
CRON_SECRET=generate-a-random-secret

# App URL (needed for payment return URLs)
NEXT_PUBLIC_SITE_URL=https://client-domain.com
```

---

## 16. Testing Checklist

### Unit Tests (`src/core/`)

- [ ] `pricing.ts` — subtotal calculation, PERCENTAGE coupon, FIXED coupon, FREE_SHIPPING coupon, tax on discounted amount, free shipping threshold, coupon expiry detection
- [ ] `create-order.ts` — order creation succeeds, inventory decremented, inventory goes negative → transaction rollback
- [ ] `merge.ts` — guest items merged into user cart, duplicate variants quantities summed, guest cart deleted
- [ ] `resolver.ts` — authenticated user gets user cart, guest gets session cart, new guest creates cart

### Integration Tests

- [ ] Full add-to-cart → checkout → Stripe webhook → order confirmed flow (Stripe test mode)
- [ ] Coupon applied at checkout, coupon.usedCount incremented on payment success
- [ ] Payment failure → order stays PENDING → inventory restored
- [ ] Guest checkout → order created with guestEmail, no userId
- [ ] Guest login after guest checkout → guest orders linked to user account (from Auth Spec)
- [ ] Race condition: simulate 2 concurrent checkouts for the last item → one succeeds, one gets 409
- [ ] Expired coupon rejected at checkout (applied earlier, expired by checkout time)

---

## 17. Decisions Explicitly Deferred to V2

| Feature | Why deferred |
|---|---|
| Cart abandonment recovery | Requires email scheduling and a "recover cart" link mechanism. Valuable but not blocking V1. |
| Save for later / Wishlist | Different UX pattern from cart. Evaluate as a V2 Core feature. |
| Multi-currency checkout | Single currency per store in V1. Multi-currency requires exchange rate service and currency-aware pricing. |
| Digital / downloadable products | No fulfilment or file delivery mechanism in V1. |
| Cart sharing (share link) | Niche use case. Not a standard e-commerce requirement. |
| Inventory reservation (hold stock during checkout) | A Redis-based hold system with TTL. Significant complexity. The current "decrement-then-check" approach is sufficient for V1 traffic levels. |
| Buy now, pay later (BNPL) | Requires integration with Tabby, Tamara (Gulf), or similar. Evaluate per-client. |

---

## 18. Dependency Summary

| Spec | Status |
|---|---|
| Auth Design Spec | ✅ Complete — cart resolver depends on `auth()` and session from Auth Spec |
| Email / Notification Spec | ⬜ Pending — order confirmation email called in webhook handler |
| API Contracts Spec | ⬜ Pending — Zod schemas for all cart and checkout request bodies |
