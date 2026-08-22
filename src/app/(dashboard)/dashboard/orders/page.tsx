import { Metadata } from "next";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { getOrders } from "@/core/orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { OrderStatusUpdater } from "@/components/dashboard/order-status-updater";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function OrdersPage(props: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; paymentStatus?: string }>;
}) {
  const searchParams = await props.searchParams;
  await requireDashboardAccess();

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const result = await getOrders({
    page,
    limit: 20,
    search: searchParams.search,
    status: searchParams.status,
    paymentStatus: searchParams.paymentStatus,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Orders</h1>
        <button 
          disabled 
          title="This feature is under development."
          className="px-4 py-2 bg-indigo-600/50 text-white/50 text-sm font-medium rounded-md cursor-not-allowed"
        >
          Create Order
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-black/40 backdrop-blur-xl p-4 rounded-xl border border-white/[0.08]">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Link
              href={`/dashboard/orders?${new URLSearchParams({
                ...(searchParams.search ? { search: searchParams.search } : {}),
                ...(searchParams.paymentStatus ? { paymentStatus: searchParams.paymentStatus } : {}),
              }).toString()}`}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                !searchParams.status ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              All Status
            </Link>
            {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"].map((status) => (
              <Link
                key={status}
                href={`/dashboard/orders?${new URLSearchParams({
                  status,
                  ...(searchParams.search ? { search: searchParams.search } : {}),
                  ...(searchParams.paymentStatus ? { paymentStatus: searchParams.paymentStatus } : {}),
                }).toString()}`}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  searchParams.status === status ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </Link>
            ))}
          </div>

          {/* Vertical Divider */}
          <div className="hidden sm:block w-px bg-white/[0.08]" />

          {/* Payment Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Link
              href={`/dashboard/orders?${new URLSearchParams({
                ...(searchParams.search ? { search: searchParams.search } : {}),
                ...(searchParams.status ? { status: searchParams.status } : {}),
              }).toString()}`}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                !searchParams.paymentStatus ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              Any Payment
            </Link>
            <Link
              href={`/dashboard/orders?${new URLSearchParams({
                paymentStatus: "PAID",
                ...(searchParams.search ? { search: searchParams.search } : {}),
                ...(searchParams.status ? { status: searchParams.status } : {}),
              }).toString()}`}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                searchParams.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              Paid Only
            </Link>
          </div>
        </div>

        {/* Search */}
        <form className="relative w-full md:w-auto flex gap-2">
          <div className="relative w-full md:w-64">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              key={searchParams.search || 'empty'}
              type="text"
              name="search"
              defaultValue={searchParams.search}
              placeholder="Search orders, emails..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
            {searchParams.paymentStatus && <input type="hidden" name="paymentStatus" value={searchParams.paymentStatus} />}
          </div>
          {(searchParams.search || searchParams.status || searchParams.paymentStatus) && (
            <Link 
              href="/dashboard/orders"
              className="flex items-center justify-center px-3 py-2 bg-zinc-800/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              title="Clear all filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Link>
          )}
        </form>
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
                result.data.map((order: any) => (
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
                      <div className="w-48">
                        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                      </div>
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
