import type { Metadata } from "next";
import { db } from "@/lib/db";
import { storeConfig } from "@/config/store.config";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Overview" };

async function getDashboardStats() {
  const [
    totalProducts,
    activeProducts,
    totalOrders,
    pendingOrders,
    totalCustomers,
    lowStockVariants,
    recentOrders,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.order.count(),
    db.order.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.productVariant.count({
      where: {
        inventoryQty: { lte: storeConfig.inventory.lowStockThreshold, gt: 0 },
        product: { status: "ACTIVE" },
      },
    }),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        guestEmail: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return {
    totalProducts,
    activeProducts,
    totalOrders,
    pendingOrders,
    totalCustomers,
    lowStockVariants,
    recentOrders,
  };
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  PAID: "bg-green-500/10 text-green-400 border-green-500/20",
  FULFILLED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  REFUNDED: "bg-zinc-700 text-zinc-400 border-zinc-600",
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts,
      sub: `${stats.activeProducts} active`,
      icon: Package,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      href: "/dashboard/products",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      sub: `${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/dashboard/orders",
    },
    {
      label: "Customers",
      value: stats.totalCustomers,
      sub: "registered accounts",
      icon: Users,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      href: "/dashboard/customers",
    },
    {
      label: "Low Stock",
      value: stats.lowStockVariants,
      sub: `≤ ${storeConfig.inventory.lowStockThreshold} units`,
      icon: AlertTriangle,
      color: stats.lowStockVariants > 0 ? "text-amber-400" : "text-zinc-500",
      bg: stats.lowStockVariants > 0 ? "bg-amber-500/10" : "bg-zinc-800",
      href: "/dashboard/products?status=ACTIVE",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-xl border border-white/[0.06] bg-[#18181b] p-5 transition-colors hover:border-white/10 hover:bg-[#1c1c1f]"
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-zinc-400" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-white">{card.value}</p>
              <p className="mt-1 text-sm font-medium text-zinc-400">{card.label}</p>
              <p className="text-xs text-zinc-600">{card.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-white/[0.06] bg-[#18181b]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
          <Link
            href="/dashboard/orders"
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            View all →
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-600">
            No orders yet. Share your store link to get started.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {stats.recentOrders.map((order) => {
              const customerName =
                order.user?.name ?? order.user?.email ?? order.guestEmail ?? "Guest";
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-6 py-3.5"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        #{order.orderNumber}
                      </p>
                      <p className="text-xs text-zinc-500">{customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[order.status] ?? "bg-zinc-800 text-zinc-400"}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {storeConfig.currency}{" "}
                      {Number(order.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
