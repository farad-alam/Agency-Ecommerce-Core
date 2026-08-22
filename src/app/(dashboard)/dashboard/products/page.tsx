import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { storeConfig } from "@/config/store.config";
import { ArchiveProductButton } from "@/components/dashboard/delete-product-button";
import { ArchivedToggle } from "@/components/dashboard/archived-toggle";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Products" };

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
  DRAFT: "bg-zinc-700 text-zinc-400 border-zinc-600",
  ARCHIVED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

async function getProducts(showArchived: boolean) {
  return db.product.findMany({
    where: showArchived ? { status: "ARCHIVED" } : { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: {
      brand: { select: { name: true } },
      categories: { select: { category: { select: { name: true } } } },
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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const products = await getProducts(showArchived);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-zinc-500">
            {products.length} {showArchived ? "archived" : "active"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={null}>
            <ArchivedToggle />
          </Suspense>
          {!showArchived && (
            <Link href="/dashboard/products/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Archived notice */}
      {showArchived && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
          Showing archived products. These are hidden from your store but their order history is fully preserved. Use the restore button to bring them back.
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#18181b]">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <p className="text-sm text-zinc-500">
              {showArchived ? "No archived products." : "No products yet."}
            </p>
            {!showArchived && (
              <Link href="/dashboard/products/new">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  Create your first product
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-6 py-3">Product</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Variants</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Price from</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {products.map((product: any) => {
                const totalStock = product.variants.reduce(
                  (sum: number, v: any) => sum + v.inventoryQty,
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
                    className={`group hover:bg-white/[0.02] ${showArchived ? "opacity-60 hover:opacity-100" : ""}`}
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
                    <td className="px-4 py-3.5 text-zinc-400 flex items-center gap-1.5 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-400">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-zinc-200">{Number(product.rating || 5).toFixed(1)}</span>
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
                      {product.categories?.length > 0
                        ? product.categories.map((c: any) => c.category.name).join(", ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500">
                      {product.brand?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <ArchiveProductButton
                        id={product.id}
                        title={product.title}
                        currentStatus={product.status}
                      />
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
