import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CollectionsManager } from "@/components/dashboard/collections-manager";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const collections = await db.collection.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Collections</h1>
      <CollectionsManager initialCollections={collections} />
    </div>
  );
}
