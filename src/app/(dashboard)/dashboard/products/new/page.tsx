import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/dashboard/product-form";

export const metadata: Metadata = { title: "New Product" };

async function getFormData() {
  const [brands, categories] = await Promise.all([
    db.brand.findMany({ orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { brands, categories };
}

export default async function NewProductPage() {
  const { brands, categories } = await getFormData();
  return <ProductForm brands={brands} categories={categories} />;
}
