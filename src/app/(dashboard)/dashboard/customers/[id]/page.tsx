import { Metadata } from "next";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { getCustomer } from "@/core/customers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Customer Profile",
};

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDashboardAccess();
  
  const { id } = await params;
  const customer = await getCustomer(id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {customer.name || "Customer Profile"}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {customer.email} • Joined {format(new Date(customer.createdAt), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
            <h2 className="text-sm font-medium text-white mb-4">Overview</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Lifetime Value</p>
                <p className="text-xl font-medium text-white mt-1">{Number(customer.lifetimeValue).toLocaleString()} BDT</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Orders</p>
                <p className="text-xl font-medium text-white mt-1">{customer.totalOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
            <h2 className="text-sm font-medium text-white mb-4">Contact Info</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-zinc-500 block text-xs">Email</span>
                <span className="text-zinc-300">{customer.email}</span>
              </div>
              {customer.phone && (
                <div>
                  <span className="text-zinc-500 block text-xs">Phone</span>
                  <span className="text-zinc-300">{customer.phone}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-0 overflow-hidden">
            <div className="p-4 border-b border-white/[0.08] bg-white/[0.02]">
              <h2 className="text-sm font-medium text-white">Recent Orders</h2>
            </div>
            
            <div className="divide-y divide-white/[0.08]">
              {customer.orders.length === 0 ? (
                <div className="p-6 text-center text-sm text-zinc-500">
                  No orders found.
                </div>
              ) : (
                customer.orders.map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div>
                      <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-indigo-400 hover:underline">
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-zinc-500 mt-1">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white font-medium">
                        {Number(order.total).toLocaleString()} {order.currency}
                      </p>
                      <Badge variant="outline" className="mt-1 text-[10px] uppercase">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
