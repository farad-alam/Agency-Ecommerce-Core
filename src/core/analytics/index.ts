import { db } from "@/lib/db";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@prisma/client";

export async function getAnalyticsSummary() {
  const now = new Date();
  const last7DaysStart = startOfDay(subDays(now, 7));
  const previous7DaysStart = startOfDay(subDays(now, 14));

  // Base where clause for completed/paid orders
  const validOrderStatus: Prisma.OrderWhereInput = {
    status: { notIn: ["CANCELLED", "REFUNDED"] },
  };

  // 1. Total Revenue (All time)
  const totalRevenueAgg = await db.order.aggregate({
    where: validOrderStatus,
    _sum: { total: true },
  });
  const totalRevenue = Number(totalRevenueAgg._sum.total || 0);

  // 2. Revenue last 7 days vs previous 7 days
  const last7DaysRevenueAgg = await db.order.aggregate({
    where: {
      ...validOrderStatus,
      createdAt: { gte: last7DaysStart },
    },
    _sum: { total: true },
    _count: { id: true },
  });
  
  const previous7DaysRevenueAgg = await db.order.aggregate({
    where: {
      ...validOrderStatus,
      createdAt: { gte: previous7DaysStart, lt: last7DaysStart },
    },
    _sum: { total: true },
    _count: { id: true },
  });

  const revenueLast7 = Number(last7DaysRevenueAgg._sum.total || 0);
  const revenuePrev7 = Number(previous7DaysRevenueAgg._sum.total || 0);
  const revenueGrowth = revenuePrev7 === 0 ? 100 : ((revenueLast7 - revenuePrev7) / revenuePrev7) * 100;

  const ordersLast7 = last7DaysRevenueAgg._count.id;
  const ordersPrev7 = previous7DaysRevenueAgg._count.id;
  const ordersGrowth = ordersPrev7 === 0 ? 100 : ((ordersLast7 - ordersPrev7) / ordersPrev7) * 100;

  // 3. Pending Orders Count
  const pendingOrdersCount = await db.order.count({
    where: { status: "PENDING" },
  });

  // 4. Low Stock Variants Count (<= 10 units)
  const lowStockCount = await db.productVariant.count({
    where: { inventoryQty: { lte: 10 } },
  });

  // 5. Recent Orders for the dashboard table
  const recentOrders = await db.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    }
  });

  return {
    overview: {
      totalRevenue,
      revenueLast7,
      revenueGrowth,
      ordersLast7,
      ordersGrowth,
      pendingOrdersCount,
      lowStockCount,
      averageOrderValue: ordersLast7 > 0 ? revenueLast7 / ordersLast7 : 0,
    },
    recentOrders,
  };
}
