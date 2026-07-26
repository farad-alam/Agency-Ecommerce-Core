import { db } from "@/lib/db";
import { Errors } from "@/core/errors";
import type {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
  ProductListQuery,
} from "./types";
import type { Prisma } from "@prisma/client";

// ─── Slug helpers ─────────────────────────────────────────────────────────────

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function ensureUniqueSlug(
  slug: string,
  excludeId?: string
): Promise<string> {
  let candidate = slug;
  let count = 0;

  while (true) {
    const existing = await db.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) return candidate;

    count++;
    candidate = `${slug}-${count}`;
  }
}

// ─── List products ────────────────────────────────────────────────────────────

export async function listProducts(query: ProductListQuery = {}) {
  const {
    status,
    brandId,
    categoryId,
    search,
    limit = 20,
    cursor,
    sort = "createdAt_desc",
  } = query;

  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : {}),
    ...(brandId ? { brandId } : {}),
    ...(categoryId
      ? { categories: { some: { categoryId } } }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "title_asc"
      ? { title: "asc" }
      : sort === "createdAt_asc"
      ? { createdAt: "asc" }
      : { createdAt: "desc" };

  const products = await db.product.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      brand: { select: { id: true, name: true } },
      variants: {
        select: { id: true, price: true, inventoryQty: true, sku: true },
      },
      media: {
        where: { position: 0 },
        select: { url: true, alt: true },
        take: 1,
      },
      _count: { select: { variants: true, reviews: true } },
    },
  });

  const hasNextPage = products.length > limit;
  const items = hasNextPage ? products.slice(0, -1) : products;

  return {
    data: items,
    total: await db.product.count({ where }),
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
  };
}

// ─── Get single product ───────────────────────────────────────────────────────

export async function getProductById(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      brand: true,
      categories: { include: { category: true } },
      collections: {
        include: {
          collection: { select: { id: true, title: true, slug: true } },
        },
      },
      variants: true,
      media: { orderBy: { position: "asc" } },
      seo: true,
    },
  });

  if (!product) throw Errors.notFound("Product");
  return product;
}

export async function getProductBySlug(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      categories: { include: { category: true } },
      variants: true,
      media: { orderBy: { position: "asc" } },
      seo: true,
    },
  });

  if (!product) throw Errors.notFound("Product");
  return product;
}

// ─── Create product ───────────────────────────────────────────────────────────

export async function createProduct(input: CreateProductInput) {
  const { categoryIds, collectionIds, ...data } = input;

  // Check slug uniqueness
  const existing = await db.product.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (existing) throw Errors.conflict("Product slug already exists");

  const product = await db.product.create({
    data: {
      ...data,
      ...(categoryIds?.length
        ? {
            categories: {
              create: categoryIds.map((categoryId) => ({ categoryId })),
            },
          }
        : {}),
      ...(collectionIds?.length
        ? {
            collections: {
              create: collectionIds.map((collectionId, position) => ({
                collectionId,
                position,
              })),
            },
          }
        : {}),
    },
    include: {
      brand: true,
      categories: { include: { category: true } },
      variants: true,
      media: true,
      seo: true,
    },
  });

  return product;
}

// ─── Update product ───────────────────────────────────────────────────────────

export async function updateProduct(id: string, input: UpdateProductInput) {
  // Verify exists
  await getProductById(id);

  // Check slug uniqueness if changing slug
  if (input.slug) {
    const existing = await db.product.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (existing && existing.id !== id) {
      throw Errors.conflict("Product slug already exists");
    }
  }

  return db.product.update({
    where: { id },
    data: input,
    include: {
      brand: true,
      categories: { include: { category: true } },
      variants: true,
      media: { orderBy: { position: "asc" } },
      seo: true,
    },
  });
}

// ─── Archive / Delete product ─────────────────────────────────────────────────

export async function archiveProduct(id: string) {
  await getProductById(id);
  return db.product.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deleteProduct(id: string) {
  await getProductById(id);
  await db.product.delete({ where: { id } });
}

// ─── Update product categories ────────────────────────────────────────────────

export async function setProductCategories(
  productId: string,
  categoryIds: string[]
) {
  await db.categoryOnProduct.deleteMany({ where: { productId } });
  if (categoryIds.length > 0) {
    await db.categoryOnProduct.createMany({
      data: categoryIds.map((categoryId) => ({ productId, categoryId })),
    });
  }
}

// ─── SEO Meta ─────────────────────────────────────────────────────────────────

export async function upsertProductSeo(
  productId: string,
  data: { metaTitle?: string; metaDescription?: string }
) {
  return db.seoMeta.upsert({
    where: { productId },
    update: data,
    create: { productId, ...data },
  });
}

// ─── Variants ─────────────────────────────────────────────────────────────────

export async function createVariant(
  productId: string,
  input: CreateVariantInput
) {
  // Check SKU uniqueness
  const existing = await db.productVariant.findUnique({
    where: { sku: input.sku },
    select: { id: true },
  });
  if (existing) throw Errors.conflict(`SKU "${input.sku}" already exists`);

  return db.productVariant.create({
    data: { ...input, productId },
  });
}

export async function updateVariant(
  variantId: string,
  input: UpdateVariantInput
) {
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!variant) throw Errors.notFound("Variant");

  return db.productVariant.update({
    where: { id: variantId },
    data: input,
  });
}

export async function deleteVariant(variantId: string) {
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!variant) throw Errors.notFound("Variant");
  await db.productVariant.delete({ where: { id: variantId } });
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function getLowStockVariants(threshold: number) {
  return db.productVariant.findMany({
    where: {
      inventoryQty: { lte: threshold, gt: 0 },
      product: { status: "ACTIVE" },
    },
    include: {
      product: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { inventoryQty: "asc" },
    take: 100,
  });
}

export async function updateVariantInventory(
  variantId: string,
  qty: number
) {
  return db.productVariant.update({
    where: { id: variantId },
    data: { inventoryQty: qty },
  });
}
