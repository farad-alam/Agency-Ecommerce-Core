# Agency Ecommerce Core — API Contracts

**Version:** v1.0
**Parent Documents:** Architecture Plan v1.0 · Cart & Checkout Spec v1.0 · Auth Design Spec v1.0
**Validation Library:** Zod (already implied by `lib/env.ts`)

---

## 0. Conventions

- All request bodies are `application/json`
- All responses are `application/json`
- Dates are ISO 8601 strings (`"2026-07-26T17:00:00.000Z"`)
- Monetary amounts are **strings** in the JSON response (Prisma `Decimal` serialises to string — never trust a JS `number` for money)
- Pagination follows a **cursor pattern** for lists: `{ data: T[], nextCursor: string | null, total: number }`
- Error responses follow the standard defined in the Error Handling Spec

---

## 1. Shared Schemas

```ts
// src/core/api/schemas/shared.ts
import { z } from "zod";

export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const IdParamSchema = z.object({ id: z.string().cuid() });

export const AddressSchema = z.object({
  name:       z.string().min(1),
  line1:      z.string().min(1),
  line2:      z.string().nullable().optional(),
  city:       z.string().min(1),
  region:     z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country:    z.string().length(2),   // ISO 3166-1 alpha-2
  phone:      z.string().nullable().optional(),
});

export const MoneySchema = z.string().regex(/^\d+(\.\d{1,2})?$/);
```

---

## 2. Auth Endpoints

### `POST /api/auth/register`

```ts
// src/core/api/schemas/auth.ts

export const RegisterRequestSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name:     z.string().min(1).optional(),
});

export const RegisterResponseSchema = z.object({
  user: z.object({
    id:        z.string(),
    email:     z.string(),
    name:      z.string().nullable(),
    role:      z.enum(["CUSTOMER"]),
    createdAt: z.string(),
  }),
});

export type RegisterRequest  = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
```

### `POST /api/auth/forgot-password`

```ts
export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

// Response is always { message: string } — 200 regardless of whether email exists
export const MessageResponseSchema = z.object({
  message: z.string(),
});
```

### `POST /api/auth/reset-password`

```ts
export const ResetPasswordRequestSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8),
});
```

### `POST /api/auth/invite`

```ts
export const InviteRequestSchema = z.object({
  email: z.string().email(),
  role:  z.enum(["STAFF", "ADMIN"]),
});

export const InviteResponseSchema = z.object({
  invite: z.object({
    id:        z.string(),
    email:     z.string(),
    role:      z.enum(["STAFF", "ADMIN"]),
    expiresAt: z.string(),
    createdAt: z.string(),
  }),
});
```

### `POST /api/auth/accept-invite`

```ts
export const AcceptInviteRequestSchema = z.object({
  token:    z.string().min(1),
  name:     z.string().min(1),
  password: z.string().min(8),
});
```

---

## 3. Products

### Shared Product Types

```ts
// src/core/products/types.ts

export const ProductStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

export const VariantResponseSchema = z.object({
  id:             z.string(),
  sku:            z.string(),
  price:          MoneySchema,
  compareAtPrice: MoneySchema.nullable(),
  options:        z.record(z.string()),   // e.g. { "size": "M", "color": "Red" }
  inventoryQty:   z.number(),
  weightGrams:    z.number().nullable(),
  barcode:        z.string().nullable(),
});

export const ProductMediaSchema = z.object({
  id:  z.string(),
  url: z.string().url(),
  alt: z.string().nullable(),
  position: z.number(),
});

export const SeoMetaSchema = z.object({
  metaTitle:       z.string().nullable(),
  metaDescription: z.string().nullable(),
});

export const ProductSummarySchema = z.object({
  id:          z.string(),
  title:       z.string(),
  slug:        z.string(),
  status:      ProductStatusSchema,
  brandId:     z.string().nullable(),
  brand:       z.object({ id: z.string(), name: z.string() }).nullable(),
  categories:  z.array(z.object({ id: z.string(), name: z.string(), slug: z.string() })),
  media:       z.array(ProductMediaSchema).max(1),   // summary = first image only
  minPrice:    MoneySchema,                           // lowest variant price
  maxPrice:    MoneySchema,                           // highest variant price
  createdAt:   z.string(),
  updatedAt:   z.string(),
});

export const ProductDetailSchema = ProductSummarySchema.extend({
  description: z.string().nullable(),
  variants:    z.array(VariantResponseSchema),
  media:       z.array(ProductMediaSchema),           // detail = all images
  seo:         SeoMetaSchema.nullable(),
});
```

### `GET /api/products`

```ts
export const ProductListQuerySchema = z.object({
  category:  z.string().optional(),     // category slug
  brand:     z.string().optional(),     // brand slug
  status:    ProductStatusSchema.optional().default("ACTIVE"),
  search:    z.string().optional(),
  minPrice:  z.coerce.number().optional(),
  maxPrice:  z.coerce.number().optional(),
  sort:      z.enum(["newest", "oldest", "price_asc", "price_desc"]).default("newest"),
  ...PaginationSchema.shape,
});

export const ProductListResponseSchema = z.object({
  data:       z.array(ProductSummarySchema),
  nextCursor: z.string().nullable(),
  total:      z.number(),
});

export type ProductListQuery    = z.infer<typeof ProductListQuerySchema>;
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
```

### `GET /api/products/[id]` — also accepts slug

```ts
export type ProductDetailResponse = z.infer<typeof ProductDetailSchema>;
```

### `POST /api/products` (Dashboard — STAFF/ADMIN)

```ts
export const CreateProductRequestSchema = z.object({
  title:       z.string().min(1),
  slug:        z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  status:      ProductStatusSchema.default("DRAFT"),
  brandId:     z.string().cuid().nullable().optional(),
  categoryIds: z.array(z.string().cuid()).optional(),
  variants: z.array(z.object({
    sku:            z.string().min(1),
    price:          z.coerce.number().positive(),
    compareAtPrice: z.coerce.number().positive().optional(),
    options:        z.record(z.string()),
    inventoryQty:   z.coerce.number().int().min(0).default(0),
    weightGrams:    z.coerce.number().int().optional(),
    barcode:        z.string().optional(),
  })).min(1, "At least one variant is required"),
  seo: z.object({
    metaTitle:       z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
  }).optional(),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
```

### `PATCH /api/products/[id]`

```ts
export const UpdateProductRequestSchema = CreateProductRequestSchema.partial();
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;
```

---

## 4. Categories

```ts
export const CategorySchema = z.object({
  id:       z.string(),
  name:     z.string(),
  slug:     z.string(),
  parentId: z.string().nullable(),
  children: z.array(z.lazy((): z.ZodTypeAny => CategorySchema)).optional(),
});

export const CreateCategoryRequestSchema = z.object({
  name:     z.string().min(1),
  slug:     z.string().regex(/^[a-z0-9-]+$/),
  parentId: z.string().cuid().nullable().optional(),
});

export const UpdateCategoryRequestSchema = CreateCategoryRequestSchema.partial();
```

---

## 5. Brands

```ts
export const BrandSchema = z.object({
  id:           z.string(),
  name:         z.string(),
  slug:         z.string(),
  productCount: z.number().optional(),
});

export const CreateBrandRequestSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

export const UpdateBrandRequestSchema = CreateBrandRequestSchema.partial();
```

---

## 6. Collections

```ts
export const CollectionSchema = z.object({
  id:          z.string(),
  title:       z.string(),
  slug:        z.string(),
  description: z.string().nullable(),
  media:       z.array(ProductMediaSchema).max(1),
  productCount: z.number(),
  createdAt:   z.string(),
});

export const CreateCollectionRequestSchema = z.object({
  title:       z.string().min(1),
  slug:        z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  productIds:  z.array(z.string().cuid()).optional(),
});

export const UpdateCollectionRequestSchema = CreateCollectionRequestSchema.partial();
```

---

## 7. Cart

```ts
export const CartItemResponseSchema = z.object({
  id:       z.string(),
  variantId: z.string(),
  quantity: z.number(),
  variant: z.object({
    id:             z.string(),
    sku:            z.string(),
    price:          MoneySchema,
    compareAtPrice: MoneySchema.nullable(),
    options:        z.record(z.string()),
    inventoryQty:   z.number(),
    product: z.object({
      id:    z.string(),
      title: z.string(),
      slug:  z.string(),
      media: z.array(ProductMediaSchema).max(1),
    }),
  }),
});

export const CartTotalsSchema = z.object({
  subtotal:      z.number(),
  discountTotal: z.number(),
  taxTotal:      z.number(),
  shippingTotal: z.number(),
  total:         z.number(),
  couponError:   z.string().nullable(),
});

export const CartResponseSchema = z.object({
  id:         z.string(),
  items:      z.array(CartItemResponseSchema),
  couponCode: z.string().nullable(),
  totals:     CartTotalsSchema,
  itemCount:  z.number(),
});

export const AddCartItemRequestSchema = z.object({
  variantId: z.string().cuid(),
  quantity:  z.coerce.number().int().min(1),
});

export const UpdateCartItemRequestSchema = z.object({
  quantity: z.coerce.number().int().min(0),   // 0 = remove
});

export const ApplyCouponRequestSchema = z.object({
  code: z.string().min(1).toUpperCase(),
});

export type CartResponse        = z.infer<typeof CartResponseSchema>;
export type AddCartItemRequest  = z.infer<typeof AddCartItemRequestSchema>;
```

---

## 8. Checkout

```ts
export const CheckoutRequestSchema = z.object({
  shippingAddress:  AddressSchema,
  billingAddress:   AddressSchema.nullable().optional(),   // null = same as shipping
  shippingRateId:   z.string().cuid(),
  paymentProvider:  z.string().min(1),
  couponCode:       z.string().optional(),
  notes:            z.string().max(500).optional(),
  guestEmail:       z.string().email().optional(),         // required if not authenticated
}).refine(
  (data) => true,  // guestEmail validation happens in the route handler (after auth check)
);

export const CheckoutResponseSchema = z.discriminatedUnion("paymentMethod", [
  z.object({
    paymentMethod: z.literal("redirect"),
    orderId:       z.string(),
    orderNumber:   z.string(),
    redirectUrl:   z.string().url(),
  }),
  z.object({
    paymentMethod: z.literal("client_secret"),
    orderId:       z.string(),
    orderNumber:   z.string(),
    clientSecret:  z.string(),
  }),
]);

export type CheckoutRequest  = z.infer<typeof CheckoutRequestSchema>;
export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;
```

---

## 9. Orders

```ts
export const OrderStatusSchema = z.enum([
  "PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"
]);

export const OrderItemResponseSchema = z.object({
  id:             z.string(),
  variantId:      z.string(),
  productTitle:   z.string(),
  variantOptions: z.record(z.string()),
  sku:            z.string(),
  price:          MoneySchema,
  quantity:       z.number(),
});

export const OrderResponseSchema = z.object({
  id:              z.string(),
  orderNumber:     z.string(),
  status:          OrderStatusSchema,
  paymentStatus:   z.enum(["UNPAID", "AUTHORIZED", "PAID", "FAILED", "REFUNDED"]),
  paymentProvider: z.string(),
  paymentRef:      z.string().nullable(),
  items:           z.array(OrderItemResponseSchema),
  subtotal:        MoneySchema,
  taxTotal:        MoneySchema,
  shippingTotal:   MoneySchema,
  discountTotal:   MoneySchema,
  total:           MoneySchema,
  currency:        z.string(),
  shippingAddress: AddressSchema,
  billingAddress:  AddressSchema.nullable(),
  couponCode:      z.string().nullable(),
  notes:           z.string().nullable(),
  guestEmail:      z.string().nullable(),
  createdAt:       z.string(),
  updatedAt:       z.string(),
  statusHistory: z.array(z.object({
    id:        z.string(),
    status:    OrderStatusSchema,
    note:      z.string().nullable(),
    createdAt: z.string(),
  })),
  refunds: z.array(z.object({
    id:        z.string(),
    amount:    MoneySchema,
    reason:    z.string().nullable(),
    status:    z.enum(["PENDING", "COMPLETED", "FAILED"]),
    createdAt: z.string(),
  })),
});

// PATCH /api/orders/[id] — staff updates status
export const UpdateOrderRequestSchema = z.object({
  status: OrderStatusSchema.optional(),
  note:   z.string().max(500).optional(),
});

// POST /api/orders/[id]/refund
export const RefundRequestSchema = z.object({
  amount: z.coerce.number().positive(),
  reason: z.string().max(500).optional(),
});

export const OrderListQuerySchema = z.object({
  status:  OrderStatusSchema.optional(),
  search:  z.string().optional(),    // order number or customer email
  ...PaginationSchema.shape,
});

export type OrderResponse = z.infer<typeof OrderResponseSchema>;
```

---

## 10. Customers

```ts
export const CustomerResponseSchema = z.object({
  id:            z.string(),
  email:         z.string(),
  name:          z.string().nullable(),
  phone:         z.string().nullable(),
  role:          z.enum(["CUSTOMER", "STAFF", "ADMIN"]),
  emailVerified: z.boolean(),
  orderCount:    z.number(),
  totalSpent:    MoneySchema,
  createdAt:     z.string(),
});

export const CustomerListQuerySchema = z.object({
  search: z.string().optional(),   // name or email
  ...PaginationSchema.shape,
});
```

---

## 11. Coupons

```ts
export const CouponSchema = z.object({
  id:          z.string(),
  code:        z.string(),
  type:        z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value:       MoneySchema,
  minSubtotal: MoneySchema.nullable(),
  maxUses:     z.number().nullable(),
  usedCount:   z.number(),
  startsAt:    z.string().nullable(),
  expiresAt:   z.string().nullable(),
  active:      z.boolean(),
});

export const CreateCouponRequestSchema = z.object({
  code:        z.string().min(3).max(20).toUpperCase().regex(/^[A-Z0-9_-]+$/),
  type:        z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value:       z.coerce.number().positive(),
  minSubtotal: z.coerce.number().positive().optional(),
  maxUses:     z.coerce.number().int().positive().optional(),
  startsAt:    z.string().datetime().optional(),
  expiresAt:   z.string().datetime().optional(),
  active:      z.boolean().default(true),
}).refine(
  (d) => d.type !== "PERCENTAGE" || d.value <= 100,
  { message: "Percentage discount cannot exceed 100", path: ["value"] }
);

export const UpdateCouponRequestSchema = CreateCouponRequestSchema.partial();
```

---

## 12. Shipping

```ts
export const ShippingRateResponseSchema = z.object({
  id:                 z.string(),
  name:               z.string(),
  price:              MoneySchema,
  isFree:             z.boolean(),   // computed — true if minSubtotalForFree met
  minSubtotalForFree: MoneySchema.nullable(),
  zoneId:             z.string(),
  zoneName:           z.string(),
});

export const ShippingRatesQuerySchema = z.object({
  country:  z.string().length(2),
  subtotal: z.coerce.number().optional(),
});

export const CreateShippingZoneRequestSchema = z.object({
  name:    z.string().min(1),
  regions: z.array(z.string().length(2)).min(1),   // ISO country codes
  rates: z.array(z.object({
    name:               z.string().min(1),
    price:              z.coerce.number().min(0),
    minSubtotalForFree: z.coerce.number().positive().optional(),
  })).min(1),
});
```

---

## 13. Reviews

```ts
export const ReviewResponseSchema = z.object({
  id:        z.string(),
  productId: z.string(),
  name:      z.string(),
  rating:    z.number().int().min(1).max(5),
  body:      z.string().nullable(),
  status:    z.enum(["PENDING", "APPROVED", "REJECTED"]),
  createdAt: z.string(),
});

export const CreateReviewRequestSchema = z.object({
  productId: z.string().cuid(),
  name:      z.string().min(1),
  rating:    z.coerce.number().int().min(1).max(5),
  body:      z.string().max(2000).optional(),
});

// PATCH /api/reviews/[id] — dashboard moderation
export const ModerateReviewRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});
```

---

## 14. Media

```ts
// POST /api/media/upload — returns Cloudinary signed upload params
export const MediaUploadResponseSchema = z.object({
  uploadUrl:  z.string().url(),      // Cloudinary upload endpoint
  signature:  z.string(),
  timestamp:  z.number(),
  apiKey:     z.string(),
  folder:     z.string(),
  publicId:   z.string(),            // pre-assigned — use this as cloudinaryId
});

export const MediaRecordSchema = z.object({
  id:          z.string(),
  url:         z.string().url(),
  cloudinaryId: z.string(),
  alt:         z.string().nullable(),
  position:    z.number(),
  productId:   z.string().nullable(),
});

// POST /api/media/confirm — called after client-side Cloudinary upload completes
export const ConfirmMediaUploadRequestSchema = z.object({
  cloudinaryId: z.string(),
  url:          z.string().url(),
  alt:          z.string().optional(),
  productId:    z.string().cuid().optional(),
});
```

---

## 15. Analytics

```ts
// GET /api/analytics/summary — dashboard overview widgets
export const AnalyticsSummaryQuerySchema = z.object({
  period: z.enum(["today", "7d", "30d"]).default("7d"),
});

export const AnalyticsSummaryResponseSchema = z.object({
  revenue:        z.number(),
  orderCount:     z.number(),
  averageOrder:   z.number(),
  topProducts: z.array(z.object({
    productId:    z.string(),
    productTitle: z.string(),
    unitsSold:    z.number(),
  })).max(5),
  lowStockCount:  z.number(),
});
```

---

## 16. Store Settings

```ts
// GET/PATCH /api/settings/store
export const StoreSettingsSchema = z.object({
  name:     z.string().min(1),
  currency: z.string().length(3),   // ISO 4217
  locale:   z.string(),
  timezone: z.string(),
  taxMode:  z.enum(["NONE", "FLAT_RATE", "REGIONAL"]),
  taxRate:  z.coerce.number().min(0).max(100).nullable(),
});

export const UpdateStoreSettingsSchema = StoreSettingsSchema.partial();
```

---

## 17. Validation Helper — Using Schemas in API Routes

Centralised parsing utility so every route validates the same way:

```ts
// src/core/api/validate.ts
import { z } from "zod";
import { NextResponse } from "next/server";

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      error: NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}

export function parseQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): { data: T } | { error: NextResponse } {
  const raw = Object.fromEntries(searchParams.entries());
  return parseBody(schema, raw);
}
```

**Usage in a route:**

```ts
// src/app/api/products/route.ts
export async function POST(req: Request) {
  await requireDashboardAccess();
  const body = await req.json();
  const parsed = parseBody(CreateProductRequestSchema, body);
  if ("error" in parsed) return parsed.error;

  const product = await createProduct(parsed.data);
  return NextResponse.json(product, { status: 201 });
}
```

---

## 18. File Map

```
src/
└── core/
    └── api/
        ├── validate.ts          # parseBody, parseQuery utilities
        └── schemas/
            ├── shared.ts        # PaginationSchema, AddressSchema, MoneySchema
            ├── auth.ts          # Register, ForgotPassword, ResetPassword, Invite
            ├── products.ts      # Product, Variant, CreateProduct, UpdateProduct
            ├── categories.ts    # Category, CreateCategory
            ├── brands.ts        # Brand, CreateBrand
            ├── collections.ts   # Collection, CreateCollection
            ├── cart.ts          # Cart, CartItem, AddItem, UpdateItem, ApplyCoupon
            ├── checkout.ts      # CheckoutRequest, CheckoutResponse
            ├── orders.ts        # Order, OrderItem, UpdateOrder, Refund
            ├── customers.ts     # Customer
            ├── coupons.ts       # Coupon, CreateCoupon
            ├── shipping.ts      # ShippingRate, CreateShippingZone
            ├── reviews.ts       # Review, CreateReview, ModerateReview
            ├── media.ts         # MediaUpload, MediaRecord
            ├── analytics.ts     # AnalyticsSummary
            └── settings.ts      # StoreSettings
```
