"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function getStorefrontProducts({ 
  categoryId, 
  brandId, 
  collectionId, 
  search, 
  page = 1, 
  limit = 20 
}: { 
  categoryId?: string, 
  brandId?: string, 
  collectionId?: string, 
  search?: string, 
  page?: number, 
  limit?: number 
}) {
  const skip = (page - 1) * limit;

  const where: any = {
    status: "ACTIVE",
  };

  if (categoryId) where.categoryId = categoryId;
  if (brandId) where.brandId = brandId;
  if (collectionId) {
    where.collections = { some: { collectionId } };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        media: {
          orderBy: { position: "asc" },
          take: 1,
        },
        variants: {
          orderBy: { price: "asc" },
          take: 1, // Get cheapest variant for "from price"
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return {
    data: products,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getStorefrontProductBySlug(slug: string) {
  const product = await db.product.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      media: { orderBy: { position: "asc" } },
      variants: true,
      brand: true,
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
}
