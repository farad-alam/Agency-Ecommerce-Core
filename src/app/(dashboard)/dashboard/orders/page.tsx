import { Metadata } from "next";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { getOrders } from "@/core/orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; status?: string };
}) {
  await requireDashboardAccess();

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const result = await getOrders({
    page,
    limit: 20,
    search: searchParams.search,
    status: searchParams.status,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Orders</h1>
      </div>

      <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Order Number</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {result.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                result.data.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-indigo-400 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {order.user?.email || order.guestEmail}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-medium">
                      {Number(order.total).toLocaleString()} {order.currency}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        order.status === "PENDING" ? "outline" : 
                        order.status === "FULFILLED" ? "default" : "secondary"
                      }>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={order.paymentStatus === "PAID" ? "default" : "outline"} className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        {order.paymentStatus}
                      </Badge>
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
