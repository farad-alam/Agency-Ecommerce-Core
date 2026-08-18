import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(10000).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  brandId: z.string().cuid().optional(),
  categoryIds: z.array(z.string().cuid()).optional(),
  collectionIds: z.array(z.string().cuid()).optional(),
});

export const updateProductSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  description: z.string().max(10000).nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  brandId: z.string().cuid().nullable().optional(),
});

export const createVariantSchema = z.object({
  sku: z.string().min(1).max(100),
  price: z.number().gt(0),
  compareAtPrice: z.number().gt(0).optional(),
  options: z.record(z.string(), z.string()),
  inventoryQty: z.number().int().min(0).default(0),
  weightGrams: z.number().int().positive().optional(),
  barcode: z.string().max(100).optional(),
});

export const updateVariantSchema = z.object({
  price: z.number().gt(0).optional(),
  compareAtPrice: z.number().gt(0).nullable().optional(),
  options: z.record(z.string(), z.string()).optional(),
  inventoryQty: z.number().int().min(0).optional(),
  weightGrams: z.number().int().positive().nullable().optional(),
  barcode: z.string().max(100).nullable().optional(),
});

export const productListQuerySchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  sort: z
    .enum(["createdAt_desc", "createdAt_asc", "title_asc", "price_asc", "price_desc"])
    .default("createdAt_desc"),
});

export const seoMetaSchema = z.object({
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  parentId: z.string().cuid().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  parentId: z.string().cuid().nullable().optional(),
});

export const brandSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
});

export const createCollectionSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  sortOrder: z.number().int().default(0),
});

export const updateCollectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  sortOrder: z.number().int().optional(),
  mediaId: z.string().cuid().nullable().optional(),
});

export const confirmMediaSchema = z.object({
  cloudinaryId: z.string().min(1),
  url: z.string().url(),
  alt: z.string().max(255).optional(),
  productId: z.string().min(1).optional(),
  position: z.number().int().min(0).optional(),
});
