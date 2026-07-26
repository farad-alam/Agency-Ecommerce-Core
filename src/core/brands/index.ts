import { db } from "@/lib/db";
import { Errors } from "@/core/errors";

export async function listBrands() {
  return db.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getBrandById(id: string) {
  const brand = await db.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!brand) throw Errors.notFound("Brand");
  return brand;
}

export async function createBrand(data: { name: string; slug: string }) {
  const existing = await db.brand.findUnique({ where: { slug: data.slug } });
  if (existing) throw Errors.conflict("Brand slug already exists");
  return db.brand.create({ data });
}

export async function updateBrand(
  id: string,
  data: { name?: string; slug?: string }
) {
  await getBrandById(id);
  if (data.slug) {
    const existing = await db.brand.findUnique({ where: { slug: data.slug } });
    if (existing && existing.id !== id) throw Errors.conflict("Brand slug already exists");
  }
  return db.brand.update({ where: { id }, data });
}

export async function deleteBrand(id: string) {
  const brand = await db.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!brand) throw Errors.notFound("Brand");
  if (brand._count.products > 0) {
    throw Errors.businessRule(
      "Cannot delete a brand that has products. Reassign products first.",
      "CONFLICT"
    );
  }
  await db.brand.delete({ where: { id } });
}
