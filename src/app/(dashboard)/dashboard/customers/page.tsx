import { Metadata } from "next";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { getCustomers } from "@/core/customers";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Customers",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  await requireDashboardAccess();

  const { page: pageStr, search } = await searchParams;
  const page = pageStr ? parseInt(pageStr) : 1;
  
  const result = await getCustomers({
    page,
    limit: 20,
    search: search,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Customers</h1>
      </div>

      <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium text-right">Orders</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {result.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                result.data.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/customers/${customer.id}`} className="font-medium text-indigo-400 hover:underline">
                        {customer.name || "Unknown"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {customer.email}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {customer.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 text-right">
                      {customer._count.orders}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {format(new Date(customer.createdAt), "MMM d, yyyy")}
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
