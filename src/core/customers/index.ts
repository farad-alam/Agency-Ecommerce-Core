import { db } from "@/lib/db";
import { Errors } from "@/core/errors";
import { CustomerQueryParams } from "./types";
import { Prisma } from "@prisma/client";

export async function getCustomers(params: CustomerQueryParams) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
  };

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [customers, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.user.count({ where }),
  ]);

  return {
    data: customers,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCustomer(id: string) {
  const customer = await db.user.findUnique({
    where: { id, role: "CUSTOMER" },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!customer) {
    throw Errors.notFound("Customer");
  }

  // Calculate lifetime value
  const stats = await db.order.aggregate({
    where: { userId: id, status: { notIn: ["CANCELLED", "REFUNDED"] } },
    _sum: { total: true },
    _count: { id: true },
  });

  return {
    ...customer,
    lifetimeValue: stats._sum.total || 0,
    totalOrders: stats._count.id || 0,
  };
}
