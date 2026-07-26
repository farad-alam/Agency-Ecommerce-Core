import { db } from "@/lib/db";
import { UpdateInventoryInput, InventoryQueryParams } from "./types";
import { Prisma } from "@prisma/client";

export async function getInventory(params: InventoryQueryParams) {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductVariantWhereInput = {};

  if (params.lowStock) {
    where.inventoryQty = { lte: 10 }; // Threshold for low stock
  }

  if (params.search) {
    where.OR = [
      { sku: { contains: params.search, mode: "insensitive" } },
      { product: { title: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const [variants, total] = await Promise.all([
    db.productVariant.findMany({
      where,
      include: {
        product: { select: { id: true, title: true, status: true } },
      },
      orderBy: [
        { inventoryQty: "asc" },
        { product: { title: "asc" } },
      ],
      skip,
      take: limit,
    }),
    db.productVariant.count({ where }),
  ]);

  return {
    data: variants,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function bulkUpdateInventory(input: UpdateInventoryInput) {
  // Use a transaction to perform bulk updates efficiently
  await db.$transaction(
    input.updates.map((update) =>
      db.productVariant.update({
        where: { id: update.variantId },
        data: { inventoryQty: update.inventoryQty },
      })
    )
  );

  return { success: true, updatedCount: input.updates.length };
}
