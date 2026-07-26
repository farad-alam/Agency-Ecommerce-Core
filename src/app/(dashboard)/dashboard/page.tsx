import { Metadata } from "next";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { getAnalyticsSummary } from "@/core/analytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Dashboard Overview",
};

export default async function DashboardPage() {
  await requireDashboardAccess();

  const data = await getAnalyticsSummary();
  const { overview, recentOrders } = data;

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-emerald-400";
    if (growth < 0) return "text-red-400";
    return "text-zinc-400";
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-3 h-3 mr-1" />;
    if (growth < 0) return <TrendingDown className="w-3 h-3 mr-1" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Overview</h1>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <Card className="p-6 border-white/[0.08] bg-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-400">Revenue (7d)</h3>
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-semibold text-white">
              ৳ {overview.revenueLast7.toLocaleString()}
            </p>
            <div className={`flex items-center text-xs font-medium ${getGrowthColor(overview.revenueGrowth)}`}>
              {getGrowthIcon(overview.revenueGrowth)}
              {Math.abs(overview.revenueGrowth).toFixed(1)}% from last week
            </div>
          </div>
        </Card>

        {/* Orders Card */}
        <Card className="p-6 border-white/[0.08] bg-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-400">Orders (7d)</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-semibold text-white">
              {overview.ordersLast7}
            </p>
            <div className={`flex items-center text-xs font-medium ${getGrowthColor(overview.ordersGrowth)}`}>
              {getGrowthIcon(overview.ordersGrowth)}
              {Math.abs(overview.ordersGrowth).toFixed(1)}% from last week
            </div>
          </div>
        </Card>

        {/* Pending Orders Card */}
        <Card className="p-6 border-white/[0.08] bg-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-400">Pending Orders</h3>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-semibold text-white">
              {overview.pendingOrdersCount}
            </p>
            <div className="flex items-center text-xs font-medium text-zinc-500 mt-1">
              Awaiting fulfillment
            </div>
          </div>
        </Card>

        {/* Low Stock Card */}
        <Card className="p-6 border-white/[0.08] bg-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-400">Low Stock Alerts</h3>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Package className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-semibold text-white">
              {overview.lowStockCount}
            </p>
            <Link href="/dashboard/inventory?lowStock=true" className="flex items-center text-xs font-medium text-indigo-400 hover:text-indigo-300 mt-1">
              View inventory →
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl overflow-hidden mt-6">
        <div className="p-4 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-white/[0.08] text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No recent orders.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-indigo-400 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {order.user?.name || order.guestEmail || "Guest"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {format(new Date(order.createdAt), "MMM d")}
                    </td>
                    <td className="px-4 py-3 text-white font-medium text-right">
                      ৳ {Number(order.total).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
