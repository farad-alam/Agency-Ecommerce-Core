"use server";

import { db } from "@/lib/db";
import { getAuthIdentifiers } from "./cart";

export async function getMyOrders({ page = 1, limit = 10 }: { page?: number; limit?: number }) {
  const { userId } = await getAuthIdentifiers();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: true,
      }
    }),
    db.order.count({ where: { userId } })
  ]);

  return {
    data: orders,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
}

export async function getMyOrder(id: string) {
  const { userId } = await getAuthIdentifiers();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const order = await db.order.findUnique({
    where: { id, userId },
    include: {
      items: true,
      statusHistory: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
}
