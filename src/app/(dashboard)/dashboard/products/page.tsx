import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { storeConfig } from "@/config/store.config";

export const metadata: Metadata = { title: "Products" };

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
  DRAFT: "bg-zinc-700 text-zinc-400 border-zinc-600",
  ARCHIVED: "bg-red-500/10 text-red-400 border-red-500/20",
};

async function getProducts() {
  return db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      brand: { select: { name: true } },
      variants: { select: { price: true, inventoryQty: true } },
      media: {
        where: { position: 0 },
        select: { url: true, alt: true },
        take: 1,
      },
      _count: { select: { variants: true } },
    },
  });
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-zinc-500">{products.length} total</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#18181b]">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <p className="text-sm text-zinc-500">No products yet.</p>
            <Link href="/dashboard/products/new">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Create your first product
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-6 py-3">Product</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Variants</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Price from</th>
                <th className="px-4 py-3">Brand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {products.map((product: any) => {
                const totalStock = product.variants.reduce(
                  (sum, v) => sum + v.inventoryQty,
                  0
                );
                const minPrice =
                  product.variants.length > 0
                    ? Math.min(...product.variants.map((v: any) => Number(v.price)))
                    : null;
                const thumb = product.media[0];
                const isLowStock =
                  totalStock > 0 &&
                  totalStock <= storeConfig.inventory.lowStockThreshold;

                return (
                  <tr
                    key={product.id}
                    className="group hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="flex items-center gap-3"
                      >
                        {/* Thumbnail */}
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb.url}
                              alt={thumb.alt ?? product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-zinc-600 text-xs">
                              No img
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-zinc-200 group-hover:text-white">
                          {product.title}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[product.status]}`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-400">
                      {product._count.variants}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={
                          totalStock === 0
                            ? "text-red-400"
                            : isLowStock
                            ? "text-amber-400"
                            : "text-zinc-400"
                        }
                      >
                        {totalStock === 0 ? "Out of stock" : totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-400">
                      {minPrice !== null
                        ? `${storeConfig.currency} ${minPrice.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500">
                      {product.brand?.name ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
