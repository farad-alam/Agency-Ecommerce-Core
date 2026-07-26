import { Metadata } from "next";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { getInventory } from "@/core/inventory";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Inventory",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; lowStock?: string }>;
}) {
  await requireDashboardAccess();

  const { page: pageStr, search, lowStock } = await searchParams;
  const page = pageStr ? parseInt(pageStr) : 1;
  const isLowStockFilter = lowStock === "true";
  
  const result = await getInventory({
    page,
    limit: 50, // Higher limit for bulk viewing
    search,
    lowStock: isLowStockFilter,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Inventory</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage stock levels across all variants.</p>
        </div>
        
        {/* Real app would use Next.js navigation for filters */}
        <div className="flex gap-2">
          {isLowStockFilter ? (
            <Link href="/dashboard/inventory" className="px-4 py-2 bg-indigo-500 text-white font-medium text-sm rounded-md hover:bg-indigo-600 transition-colors">
              Clear Low Stock Filter
            </Link>
          ) : (
            <Link href="/dashboard/inventory?lowStock=true" className="px-4 py-2 border border-white/[0.1] text-white font-medium text-sm rounded-md hover:bg-white/[0.05] transition-colors">
              Show Low Stock
            </Link>
          )}
        </div>
      </div>

      <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          {/* Note: In a real app, this would be a client component to handle the PATCH request to save bulk inputs */}
          <table className="w-full text-sm text-left">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Variant SKU</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right w-32">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {result.data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No variants found.
                  </td>
                </tr>
              ) : (
                result.data.map((variant: any) => (
                  <tr key={variant.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">
                      <Link href={`/dashboard/products/${variant.product.id}`} className="hover:underline">
                        {variant.product.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {variant.sku}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={variant.product.status === "ACTIVE" ? "default" : "secondary"}>
                        {variant.product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* For this SSR view, it's read-only. Client app replaces this with an <input> */}
                      <div className={`font-medium ${variant.inventoryQty <= 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {variant.inventoryQty}
                      </div>
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
