import type { Prisma } from "@prisma/client";

// ─── Product types ────────────────────────────────────────────────────────────

export type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    brand: true;
    categories: { include: { category: true } };
    collections: { include: { collection: { select: { id: true; title: true; slug: true } } } };
    variants: true;
    media: { orderBy: { position: "asc" } };
    seo: true;
  };
}>;

export type ProductListItem = Prisma.ProductGetPayload<{
  include: {
    brand: { select: { id: true; name: true } };
    variants: { select: { id: true; price: true; inventoryQty: true; sku: true } };
    media: { where: { position: { equals: 0 } }; select: { url: true; alt: true } };
    _count: { select: { variants: true; reviews: true } };
  };
}>;

export type VariantWithProduct = Prisma.ProductVariantGetPayload<{
  include: { product: { select: { id: true; title: true; slug: true } } };
}>;

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateProductInput {
  title: string;
  slug: string;
  description?: string;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  brandId?: string;
  categoryIds?: string[];
  collectionIds?: string[];
}

export interface UpdateProductInput {
  title?: string;
  slug?: string;
  description?: string | null;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  brandId?: string | null;
}

export interface CreateVariantInput {
  sku: string;
  price: number;
  compareAtPrice?: number;
  options: Record<string, string>;
  inventoryQty: number;
  weightGrams?: number;
  barcode?: string;
}

export interface UpdateVariantInput {
  price?: number;
  compareAtPrice?: number | null;
  options?: Record<string, string>;
  inventoryQty?: number;
  weightGrams?: number | null;
  barcode?: string | null;
}

export interface ProductListQuery {
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  brandId?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
  cursor?: string;
  sort?: "createdAt_desc" | "createdAt_asc" | "title_asc" | "price_asc" | "price_desc";
}
