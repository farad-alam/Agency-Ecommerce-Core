import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoriesManager } from "@/components/dashboard/categories-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    include: {
      parent: { select: { name: true } },
      _count: { select: { products: true, children: true } },
    },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Categories</h1>
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
