import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BrandsManager } from "@/components/dashboard/brands-manager";

export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage() {
  const brands = await db.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Brands</h1>
      <BrandsManager initialBrands={brands} />
    </div>
  );
}
