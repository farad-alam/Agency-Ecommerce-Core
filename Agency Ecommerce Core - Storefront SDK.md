# Agency Ecommerce Core — Storefront SDK & Hooks

**Version:** v1.0
**Location:** `src/storefront-sdk/`
**Owner:** CORE-OWNED — ships with every clone, used by client storefronts

---

## 0. Purpose

The Architecture doc established that storefronts talk to Core only through public API routes and shared types. Without a standard data-fetching layer, every client project reinvents the same fetch logic, loading states, and error handling.

The Storefront SDK solves this by shipping a set of typed React hooks and server-side fetch utilities that:
- Handle auth headers and cart session cookies automatically
- Provide consistent loading/error states
- Are typed using the schemas from the API Contracts Spec
- Work with both Server Components (async fetch) and Client Components (hooks)

**Rule:** The SDK is CORE-OWNED — it must never be modified per client. Client developers use it, they don't edit it.

---

## 1. Two Access Patterns

The SDK provides utilities for both Next.js access patterns:

| Pattern | Use case | Utility |
|---|---|---|
| **Server Component** (RSC) | Product pages, collection pages, SEO-critical pages | `serverFetch()` async functions |
| **Client Component** (hooks) | Cart, checkout, interactive filters, account pages | `use*()` React hooks with SWR |

---

## 2. Base Fetch Utility

```ts
// src/storefront-sdk/fetch.ts

export class APIError extends Error {
  constructor(
    public message:    string,
    public statusCode: number,
    public code?:      string,
    public details?:   Record<string, unknown>
  ) {
    super(message);
    this.name = "APIError";
  }
}

interface FetchOptions extends RequestInit {
  searchParams?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { searchParams, ...init } = options;

  const url = new URL(path, process.env.NEXT_PUBLIC_SITE_URL);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new APIError(
      body.error ?? "An unexpected error occurred",
      res.status,
      body.code,
      body.details
    );
  }

  return res.json() as Promise<T>;
}
```

---

## 3. Server-Side Fetch Functions (RSC)

Used in `async` Server Components — no hooks, no SWR.

```ts
// src/storefront-sdk/server/products.ts

import { apiFetch } from "../fetch";
import type { ProductListResponse, ProductDetailResponse, ProductListQuery } from "@/core/api/schemas/products";

export async function getProducts(query?: Partial<ProductListQuery>): Promise<ProductListResponse> {
  return apiFetch("/api/products", {
    searchParams: query as Record<string, string>,
    next: { revalidate: 60 },   // ISR — revalidate every 60s
  });
}

export async function getProductBySlug(slug: string): Promise<ProductDetailResponse> {
  return apiFetch(`/api/products/${slug}`, {
    next: { revalidate: 60 },
  });
}

export async function getCategories() {
  return apiFetch("/api/categories", { next: { revalidate: 3600 } });
}

export async function getBrands() {
  return apiFetch("/api/brands", { next: { revalidate: 3600 } });
}

export async function getCollections() {
  return apiFetch("/api/collections", { next: { revalidate: 3600 } });
}

export async function getCollectionBySlug(slug: string) {
  return apiFetch(`/api/collections/${slug}`, { next: { revalidate: 60 } });
}

export async function getShippingRates(country: string, subtotal?: number) {
  return apiFetch("/api/shipping/rates", {
    searchParams: { country, subtotal },
  });
}
```

```ts
// src/storefront-sdk/server/orders.ts

import { auth } from "@/lib/auth";
import { apiFetch } from "../fetch";
import type { OrderResponse } from "@/core/api/schemas/orders";

export async function getMyOrders() {
  // Server Component with auth — session available via auth()
  return apiFetch<{ data: OrderResponse[] }>("/api/orders");
}

export async function getOrderByNumber(orderNumber: string) {
  return apiFetch<OrderResponse>(`/api/orders?orderNumber=${orderNumber}`);
}
```

---

## 4. SWR Setup

```ts
// src/storefront-sdk/swr-config.tsx
// Place in (storefront)/layout.tsx

"use client";

import { SWRConfig } from "swr";
import { APIError } from "./fetch";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => fetch(url).then(async (r) => {
          if (!r.ok) {
            const body = await r.json().catch(() => ({}));
            throw new APIError(body.error ?? "Request failed", r.status, body.code);
          }
          return r.json();
        }),
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

---

## 5. Cart Hooks

```ts
// src/storefront-sdk/hooks/use-cart.ts

"use client";

import useSWR, { mutate } from "swr";
import { apiFetch } from "../fetch";
import type { CartResponse, AddCartItemRequest } from "@/core/api/schemas/cart";

const CART_KEY = "/api/cart";

export function useCart() {
  const { data, error, isLoading } = useSWR<CartResponse>(CART_KEY);

  return {
    cart:      data,
    isLoading,
    error,
    itemCount: data?.itemCount ?? 0,
  };
}

export function useCartActions() {
  const addItem = async (variantId: string, quantity = 1) => {
    await apiFetch(CART_KEY + "/items", {
      method: "POST",
      body: JSON.stringify({ variantId, quantity } satisfies AddCartItemRequest),
    });
    mutate(CART_KEY);
  };

  const updateItem = async (itemId: string, quantity: number) => {
    await apiFetch(`${CART_KEY}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
    mutate(CART_KEY);
  };

  const removeItem = async (itemId: string) => {
    await apiFetch(`${CART_KEY}/items/${itemId}`, { method: "DELETE" });
    mutate(CART_KEY);
  };

  const applyCoupon = async (code: string) => {
    const result = await apiFetch<{ totals: CartResponse["totals"] }>(
      CART_KEY + "/coupon",
      { method: "POST", body: JSON.stringify({ code }) }
    );
    mutate(CART_KEY);
    return result;
  };

  const removeCoupon = async () => {
    await apiFetch(CART_KEY + "/coupon", { method: "DELETE" });
    mutate(CART_KEY);
  };

  const clearCart = async () => {
    await apiFetch(CART_KEY + "/clear", { method: "DELETE" });
    mutate(CART_KEY);
  };

  return { addItem, updateItem, removeItem, applyCoupon, removeCoupon, clearCart };
}
```

### Usage in a Client Component

```tsx
// (storefront)/products/[slug]/add-to-cart-button.tsx
"use client";

import { useCartActions } from "@/storefront-sdk/hooks/use-cart";

export function AddToCartButton({ variantId }: { variantId: string }) {
  const { addItem } = useCartActions();
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    try {
      await addItem(variantId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleAdd} disabled={loading}>
      {loading ? "Adding..." : "Add to Cart"}
    </button>
  );
}
```

---

## 6. Auth Hooks

```ts
// src/storefront-sdk/hooks/use-auth.ts

"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user:            session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading:       status === "loading",
    role:            session?.user?.role ?? null,
    isCustomer:      session?.user?.role === "CUSTOMER",
    isStaff:         session?.user?.role === "STAFF" || session?.user?.role === "ADMIN",
    isAdmin:         session?.user?.role === "ADMIN",
    login:           (email: string, password: string) =>
                       signIn("credentials", { email, password, redirect: false }),
    loginWithGoogle: () => signIn("google"),
    logout:          () => signOut({ callbackUrl: "/" }),
  };
}
```

---

## 7. Product Hooks (Client-side)

```ts
// src/storefront-sdk/hooks/use-products.ts

"use client";

import useSWR from "swr";
import type { ProductListResponse } from "@/core/api/schemas/products";

export function useProducts(query?: Record<string, string>) {
  const params = new URLSearchParams(query ?? {}).toString();
  const key = `/api/products${params ? `?${params}` : ""}`;

  const { data, error, isLoading } = useSWR<ProductListResponse>(key);

  return {
    products:   data?.data ?? [],
    total:      data?.total ?? 0,
    nextCursor: data?.nextCursor ?? null,
    isLoading,
    error,
  };
}

export function useProduct(slugOrId: string) {
  const { data, error, isLoading } = useSWR(`/api/products/${slugOrId}`);
  return { product: data, isLoading, error };
}
```

---

## 8. Order Hooks

```ts
// src/storefront-sdk/hooks/use-orders.ts

"use client";

import useSWR from "swr";
import type { OrderResponse } from "@/core/api/schemas/orders";

export function useMyOrders() {
  const { data, error, isLoading } = useSWR<{ data: OrderResponse[] }>("/api/orders");
  return { orders: data?.data ?? [], isLoading, error };
}

export function useOrder(orderNumber: string) {
  const { data, error, isLoading } = useSWR<OrderResponse>(
    orderNumber ? `/api/orders?orderNumber=${orderNumber}` : null
  );
  return { order: data, isLoading, error };
}
```

---

## 9. Checkout Hook

```ts
// src/storefront-sdk/hooks/use-checkout.ts

"use client";

import { useState } from "react";
import { apiFetch } from "../fetch";
import type { CheckoutRequest, CheckoutResponse } from "@/core/api/schemas/checkout";

export function useCheckout() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitCheckout = async (data: CheckoutRequest): Promise<CheckoutResponse | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<CheckoutResponse>("/api/checkout", {
        method: "POST",
        body: JSON.stringify(data),
      });

      // Handle redirect-based payment
      if (result.paymentMethod === "redirect") {
        window.location.href = result.redirectUrl;
        return null;   // navigation is happening
      }

      return result;   // caller handles client_secret (Stripe Elements)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Checkout failed";
      setError(msg);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitCheckout, isSubmitting, error };
}
```

---

## 10. Utility Hooks

```ts
// src/storefront-sdk/hooks/use-shipping-rates.ts

"use client";

import useSWR from "swr";

export function useShippingRates(country: string, subtotal?: number) {
  const enabled = country.length === 2;
  const key = enabled
    ? `/api/shipping/rates?country=${country}${subtotal ? `&subtotal=${subtotal}` : ""}`
    : null;

  const { data, isLoading } = useSWR(key);
  return { rates: data?.rates ?? [], isLoading };
}
```

---

## 11. SDK Entry Point

```ts
// src/storefront-sdk/index.ts
// Client Components — import from here

export { useCart, useCartActions } from "./hooks/use-cart";
export { useAuth } from "./hooks/use-auth";
export { useProducts, useProduct } from "./hooks/use-products";
export { useMyOrders, useOrder } from "./hooks/use-orders";
export { useCheckout } from "./hooks/use-checkout";
export { useShippingRates } from "./hooks/use-shipping-rates";
export { SWRProvider } from "./swr-config";
export { APIError } from "./fetch";

// Server Components — import from here
export * as serverProducts from "./server/products";
export * as serverOrders   from "./server/orders";
```

---

## 12. File Map

```
src/
└── storefront-sdk/
    ├── index.ts                         # Public entry — exports everything
    ├── fetch.ts                         # apiFetch + APIError base
    ├── swr-config.tsx                   # SWRProvider for client layout
    ├── hooks/
    │   ├── use-cart.ts                  # useCart, useCartActions
    │   ├── use-auth.ts                  # useAuth
    │   ├── use-products.ts              # useProducts, useProduct
    │   ├── use-orders.ts                # useMyOrders, useOrder
    │   ├── use-checkout.ts              # useCheckout
    │   └── use-shipping-rates.ts        # useShippingRates
    └── server/
        ├── products.ts                  # getProducts, getProductBySlug, getCategories, etc.
        └── orders.ts                    # getMyOrders, getOrderByNumber
```

---

## 13. Rules for Client Developers

1. **Never call `fetch()` directly** in a storefront component. Always use `apiFetch()` or a hook from the SDK.
2. **Never import from `src/core/*`** in a storefront component — only from `src/storefront-sdk` and `src/core/*/types.ts`.
3. **Server Components use server functions** (`serverProducts.getProducts()`). Client Components use hooks (`useProducts()`).
4. **Never modify SDK files** in a client project. If a hook is missing, request it as a Core improvement.
