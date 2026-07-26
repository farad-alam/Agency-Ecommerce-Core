import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/dashboard/product-form";
import type { Prisma } from "@prisma/client";

type Props = { params: Promise<{ id: string }> };

// Explicit Prisma return type so ProductForm receives a correctly typed value
const productWithRelations = {
  include: {
    brand: true,
    categories: { include: { category: true } },
    variants: { orderBy: { price: "asc" as const } },
    media: { orderBy: { position: "asc" as const } },
    seo: true,
  },
} satisfies Prisma.ProductDefaultArgs;

export type ProductFull = Prisma.ProductGetPayload<typeof productWithRelations>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, select: { title: true } });
  return { title: product ? `Edit: ${product.title}` : "Product Not Found" };
}

async function getPageData(id: string) {
  const [product, brands, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, ...productWithRelations }),
    db.brand.findMany({ orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { product, brands, categories };
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const { product, brands, categories } = await getPageData(id);

  if (!product) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">{product.title}</h1>
        <p className="text-sm text-zinc-500">
          Last updated{" "}
          {product.updatedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
      <ProductForm product={product} brands={brands} categories={categories} />
    </div>
  );
}
