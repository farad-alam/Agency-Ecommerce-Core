# Agency Ecommerce Core — Error Handling Standard

**Version:** v1.0
**Scope:** API routes, Core business logic, Storefront SDK

---

## 0. Goals

- Every API error response has the **same shape** — client code never needs to guess
- Validation errors surface field-level detail — not just "400 Bad Request"
- Business logic errors are distinguishable from infrastructure errors
- Uncaught errors are logged but never leak stack traces to clients
- Error handling is centralised — not copy-pasted into every route

---

## 1. Standard Error Response Shape

Every error from every API route uses this exact JSON structure:

```ts
interface ErrorResponse {
  error:   string;                              // Human-readable message
  code:    string;                              // Machine-readable error code (see §3)
  details?: Record<string, string[]>;          // Field-level errors (validation only)
  requestId?: string;                           // Trace ID for log correlation (optional, V2)
}
```

### Examples

```json
// 400 — Validation error
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": ["Invalid email address"],
    "password": ["Password must be at least 8 characters"]
  }
}

// 401 — Not authenticated
{ "error": "Unauthorized", "code": "UNAUTHORIZED" }

// 403 — Wrong role
{ "error": "Forbidden", "code": "FORBIDDEN" }

// 404 — Resource not found
{ "error": "Product not found", "code": "NOT_FOUND" }

// 409 — Conflict
{ "error": "Email already exists", "code": "CONFLICT" }

// 409 — Inventory conflict
{
  "error": "Insufficient inventory",
  "code": "INVENTORY_INSUFFICIENT",
  "details": { "variantId": ["Only 2 units available"] }
}

// 500 — Internal server error (stack trace never exposed)
{ "error": "An unexpected error occurred", "code": "INTERNAL_ERROR" }
```

---

## 2. HTTP Status Code Conventions

| Status | When to use |
|---|---|
| `200` | Successful GET, PATCH, DELETE |
| `201` | Successful POST that creates a resource |
| `400` | Invalid request body or query params (validation) |
| `401` | Not authenticated — no session |
| `403` | Authenticated but wrong role or resource ownership |
| `404` | Resource not found |
| `409` | Conflict — duplicate (email, slug, SKU) or inventory failure |
| `422` | Business rule violation (coupon expired, checkout failed domain logic) |
| `429` | Rate limited |
| `500` | Unhandled error — logged, generic message returned |

**Important distinctions:**
- `401` = "Who are you?" — no session at all
- `403` = "I know who you are, but you can't do this" — wrong role or resource ownership
- `409` = Database-level conflict (unique constraint) or inventory conflict
- `422` = Business logic failure (coupon expired, cart empty at checkout) — request was valid, but the business domain rejected it

---

## 3. Error Code Registry

```ts
// src/core/errors/codes.ts

export const ErrorCode = {
  // Auth
  UNAUTHORIZED:               "UNAUTHORIZED",
  FORBIDDEN:                  "FORBIDDEN",
  INVALID_CREDENTIALS:        "INVALID_CREDENTIALS",
  TOKEN_EXPIRED:              "TOKEN_EXPIRED",
  TOKEN_INVALID:              "TOKEN_INVALID",

  // Validation
  VALIDATION_ERROR:           "VALIDATION_ERROR",

  // Resources
  NOT_FOUND:                  "NOT_FOUND",
  CONFLICT:                   "CONFLICT",

  // Business logic
  COUPON_INVALID:             "COUPON_INVALID",
  COUPON_EXPIRED:             "COUPON_EXPIRED",
  COUPON_USAGE_LIMIT:         "COUPON_USAGE_LIMIT",
  COUPON_MIN_SUBTOTAL:        "COUPON_MIN_SUBTOTAL",
  INVENTORY_INSUFFICIENT:     "INVENTORY_INSUFFICIENT",
  CART_EMPTY:                 "CART_EMPTY",
  GUEST_CHECKOUT_DISABLED:    "GUEST_CHECKOUT_DISABLED",
  PAYMENT_PROVIDER_INVALID:   "PAYMENT_PROVIDER_INVALID",
  SHIPPING_ZONE_NOT_COVERED:  "SHIPPING_ZONE_NOT_COVERED",

  // Infrastructure
  INTERNAL_ERROR:             "INTERNAL_ERROR",
  RATE_LIMITED:               "RATE_LIMITED",
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];
```

---

## 4. Core Error Classes

```ts
// src/core/errors/index.ts

export class AppError extends Error {
  constructor(
    public message:    string,
    public statusCode: number,
    public code:       ErrorCode,
    public details?:   Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Convenience factory methods
export const Errors = {
  unauthorized: (message = "Unauthorized") =>
    new AppError(message, 401, ErrorCode.UNAUTHORIZED),

  forbidden: (message = "Forbidden") =>
    new AppError(message, 403, ErrorCode.FORBIDDEN),

  notFound: (resource: string) =>
    new AppError(`${resource} not found`, 404, ErrorCode.NOT_FOUND),

  conflict: (message: string) =>
    new AppError(message, 409, ErrorCode.CONFLICT),

  validation: (details: Record<string, string[]>) =>
    new AppError("Validation failed", 400, ErrorCode.VALIDATION_ERROR, details),

  businessRule: (message: string, code: ErrorCode) =>
    new AppError(message, 422, code),

  inventoryInsufficient: (variantId: string, available: number) =>
    new AppError("Insufficient inventory", 409, ErrorCode.INVENTORY_INSUFFICIENT, {
      variantId: [`Only ${available} units available`],
    }),

  internal: () =>
    new AppError("An unexpected error occurred", 500, ErrorCode.INTERNAL_ERROR),
} as const;
```

---

## 5. Global Error Handler for API Routes

```ts
// src/core/errors/handler.ts

import { NextResponse } from "next/server";
import { AppError } from "./index";
import { ZodError } from "zod";

export function handleError(error: unknown): NextResponse {
  // Known application error
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error:   error.message,
        code:    error.code,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode }
    );
  }

  // Zod validation error (if not pre-converted)
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error:   "Validation failed",
        code:    "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // Prisma errors
  if (typeof error === "object" && error !== null && "code" in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };

    if (prismaError.code === "P2002") {
      // Unique constraint violation
      const field = prismaError.meta?.target?.[0] ?? "field";
      return NextResponse.json(
        { error: `${field} already exists`, code: "CONFLICT" },
        { status: 409 }
      );
    }

    if (prismaError.code === "P2025") {
      // Record not found (e.g. update/delete on non-existent ID)
      return NextResponse.json(
        { error: "Record not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
  }

  // Unknown error — log it, return generic message
  console.error("[UNHANDLED ERROR]", error);
  return NextResponse.json(
    { error: "An unexpected error occurred", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
```

---

## 6. `withHandler` Route Wrapper

Every API route handler wraps in `withHandler` to avoid repetitive try/catch:

```ts
// src/core/errors/with-handler.ts

import { NextResponse } from "next/server";
import { handleError } from "./handler";

type RouteHandler = (req: Request, context?: unknown) => Promise<NextResponse>;

export function withHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleError(error);
    }
  };
}
```

### Combined with `withAuth` (from Auth Spec)

In practice, most routes use both:

```ts
// src/app/api/products/route.ts

import { withHandler } from "@/core/errors/with-handler";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { parseBody } from "@/core/api/validate";
import { CreateProductRequestSchema } from "@/core/api/schemas/products";
import { Errors } from "@/core/errors";

export const POST = withHandler(async (req) => {
  await requireDashboardAccess();

  const body = await req.json();
  const parsed = parseBody(CreateProductRequestSchema, body);
  if ("error" in parsed) return parsed.error;

  // Business logic that might throw AppError
  const product = await createProduct(parsed.data);
  return NextResponse.json(product, { status: 201 });
});

// If createProduct() throws Errors.conflict("Slug already exists"),
// withHandler catches it and returns { error: "Slug already exists", code: "CONFLICT", status: 409 }
```

---

## 7. Core Business Logic — Throwing Errors

Business logic in `src/core/*/` throws `AppError` using the `Errors` factory. It never returns `null` for "not found" — always throws:

```ts
// src/core/products/index.ts

import { db } from "@/lib/db";
import { Errors } from "@/core/errors";

export async function getProductBySlug(slug: string) {
  const product = await db.product.findUnique({ where: { slug } });
  if (!product) throw Errors.notFound("Product");
  return product;
}

export async function createProduct(data: CreateProductRequest) {
  // Check for slug conflict before creation
  const existing = await db.product.findUnique({ where: { slug: data.slug } });
  if (existing) throw Errors.conflict("Product slug already exists");

  return db.product.create({ data });
}
```

---

## 8. Storefront SDK — Client Error Handling

The SDK's `APIError` (from Storefront SDK Spec) maps to the server's error shape:

```ts
// In a Client Component using SDK hooks
const { addItem } = useCartActions();

const handleAdd = async () => {
  try {
    await addItem(variantId);
  } catch (err) {
    if (err instanceof APIError) {
      if (err.code === "INVENTORY_INSUFFICIENT") {
        toast.error("Sorry, this item is out of stock.");
      } else {
        toast.error(err.message);
      }
    }
  }
};
```

---

## 9. What NOT to Do

```ts
// ❌ Never return null for not found — always throw
async function getProduct(id: string) {
  return db.product.findUnique({ where: { id } });  // returns null if not found
}

// ✅ Throw AppError instead
async function getProduct(id: string) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product) throw Errors.notFound("Product");
  return product;
}

// ❌ Never leak stack traces
catch (err) {
  return NextResponse.json({ error: err.stack }, { status: 500 });
}

// ✅ Use handleError() which sanitises unknown errors
catch (err) {
  return handleError(err);  // returns generic message for unknown errors
}

// ❌ Never use different error shapes per route
{ "message": "Not found" }       // some routes
{ "error": "Resource missing" }  // other routes

// ✅ Always use the standard shape via AppError + handleError
{ "error": "Product not found", "code": "NOT_FOUND" }
```

---

## 10. File Map

```
src/
└── core/
    └── errors/
        ├── codes.ts           # ErrorCode registry (const enum)
        ├── index.ts           # AppError class + Errors factory methods
        ├── handler.ts         # handleError() — maps all error types to NextResponse
        └── with-handler.ts    # withHandler() — route wrapper
```
