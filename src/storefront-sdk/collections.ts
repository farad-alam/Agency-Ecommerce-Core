"use server";

import { db } from "@/lib/db";

export async function getStorefrontCollections() {
  return await db.collection.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
    include: {
      media: true,
    }
  });
}

export async function getStorefrontCollectionBySlug(slug: string) {
  const collection = await db.collection.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      media: true,
      seo: true,
    }
  });

  if (!collection) {
    throw new Error("Collection not found");
  }

  return collection;
}
