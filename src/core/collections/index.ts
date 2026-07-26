import { db } from "@/lib/db";
import { Errors } from "@/core/errors";
import type { CreateCollectionInput, UpdateCollectionInput } from "./types";

export async function listCollections(status?: "DRAFT" | "ACTIVE" | "ARCHIVED") {
  return db.collection.findMany({
    where: status ? { status } : undefined,
    orderBy: { sortOrder: "asc" },
    include: {
      media: { select: { url: true, alt: true } },
      _count: { select: { products: true } },
    },
  });
}

export async function getCollectionById(id: string) {
  const collection = await db.collection.findUnique({
    where: { id },
    include: {
      media: true,
      seo: true,
      products: {
        orderBy: { position: "asc" },
        include: {
          product: {
            include: {
              variants: { orderBy: { price: "asc" }, take: 1 },
              media: { orderBy: { position: "asc" }, take: 1 },
            },
          },
        },
      },
      _count: { select: { products: true } },
    },
  });
  if (!collection) throw Errors.notFound("Collection");
  return collection;
}

export async function getCollectionBySlug(slug: string) {
  const collection = await db.collection.findUnique({
    where: { slug },
    include: {
      media: true,
      seo: true,
      products: {
        orderBy: { position: "asc" },
        include: {
          product: {
            include: {
              variants: { orderBy: { price: "asc" }, take: 1 },
              media: { orderBy: { position: "asc" }, take: 1 },
            },
          },
        },
      },
    },
  });
  if (!collection) throw Errors.notFound("Collection");
  return collection;
}

export async function createCollection(input: CreateCollectionInput) {
  const existing = await db.collection.findUnique({ where: { slug: input.slug } });
  if (existing) throw Errors.conflict("Collection slug already exists");
  return db.collection.create({ data: input });
}

export async function updateCollection(id: string, input: UpdateCollectionInput) {
  await getCollectionById(id);
  if (input.slug) {
    const existing = await db.collection.findUnique({ where: { slug: input.slug } });
    if (existing && existing.id !== id) throw Errors.conflict("Collection slug already exists");
  }
  return db.collection.update({ where: { id }, data: input });
}

export async function deleteCollection(id: string) {
  await getCollectionById(id);
  await db.collection.delete({ where: { id } });
}

export async function addProductsToCollection(collectionId: string, productIds: string[]) {
  await getCollectionById(collectionId);

  const maxPos = await db.collectionOnProduct.aggregate({
    where: { collectionId },
    _max: { position: true },
  });
  let nextPosition = (maxPos._max.position ?? -1) + 1;

  await db.collectionOnProduct.createMany({
    data: productIds.map((productId) => ({
      collectionId,
      productId,
      position: nextPosition++,
    })),
    skipDuplicates: true,
  });
}

export async function removeProductFromCollection(collectionId: string, productId: string) {
  await db.collectionOnProduct.delete({
    where: { collectionId_productId: { collectionId, productId } },
  });
}

export async function reorderCollectionProducts(
  collectionId: string,
  orderedProductIds: string[]
) {
  await db.$transaction(
    orderedProductIds.map((productId, index) =>
      db.collectionOnProduct.update({
        where: { collectionId_productId: { collectionId, productId } },
        data: { position: index },
      })
    )
  );
}
