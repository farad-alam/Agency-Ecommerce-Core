import { db } from "@/lib/db";
import { Errors } from "@/core/errors";
import { Prisma } from "@prisma/client";
import { UpdateOrderStatusInput } from "./types";
import * as React from "react";
import { sendEmail } from "@/lib/email";
import { OrderStatusEmail } from "@/components/emails/order-status";

export const orderInclude = {
  items: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    }
  },
  statusHistory: {
    orderBy: { createdAt: "desc" } as const,
  },
  mfsPayment: true,
} satisfies Prisma.OrderInclude;

export type OrderFull = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export async function getOrders(params: {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {};

  if (params.status) {
    where.status = params.status as any; // Cast needed due to prisma enum typing
  }
  if (params.paymentStatus) {
    where.paymentStatus = params.paymentStatus as any;
  }

  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: "insensitive" } },
      { guestEmail: { contains: params.search, mode: "insensitive" } },
      { user: { email: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.order.count({ where }),
  ]);

  return {
    data: orders,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getOrder(id: string): Promise<OrderFull> {
  const order = await db.order.findUnique({
    where: { id },
    include: orderInclude,
  });

  if (!order) {
    throw Errors.notFound("Order");
  }

  return order;
}

export async function updateOrderStatus(id: string, input: UpdateOrderStatusInput): Promise<OrderFull> {
  const order = await getOrder(id);

  if (order.status === input.status) {
    return order;
  }

  const updatedOrder = await db.$transaction(async (tx) => {
    // 1. Record event
    await tx.orderStatusEvent.create({
      data: {
        orderId: id,
        status: input.status,
        note: input.note,
      },
    });

    // 2. Update status
    return tx.order.update({
      where: { id },
      data: { status: input.status },
      include: orderInclude,
    });
  });

  // Trigger email notifications based on status change here
  const emailToSendTo = order.user?.email || order.guestEmail;
  if (emailToSendTo && ["SHIPPED", "CANCELLED", "DELIVERED"].includes(input.status)) {
    const address = order.shippingAddress as Record<string, string>;
    const customerName = order.user?.name || address?.firstName || "Customer";
    
    // We intentionally don't await to avoid blocking the API response
    sendEmail({
      to: emailToSendTo,
      subject: `Order Update - ${order.orderNumber} is now ${input.status}`,
      react: React.createElement(OrderStatusEmail, {
        orderNumber: order.orderNumber,
        customerName: customerName,
        status: input.status,
        note: input.note || undefined
      })
    });
  }

  return updatedOrder;
}
