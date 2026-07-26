import { db } from "@/lib/db";
import { Errors } from "@/core/errors";
import type { CreateCategoryInput, UpdateCategoryInput } from "./types";

export async function listCategories() {
  return db.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          children: true,
          _count: { select: { products: true } },
        },
      },
      _count: { select: { products: true, children: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function listAllCategories() {
  return db.category.findMany({
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true, children: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryById(id: string) {
  const category = await db.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: { include: { _count: { select: { products: true } } } },
      _count: { select: { products: true } },
    },
  });
  if (!category) throw Errors.notFound("Category");
  return category;
}

export async function createCategory(input: CreateCategoryInput) {
  const existing = await db.category.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (existing) throw Errors.conflict("Category slug already exists");

  if (input.parentId) {
    const parent = await db.category.findUnique({ where: { id: input.parentId } });
    if (!parent) throw Errors.notFound("Parent category");
  }

  return db.category.create({ data: input });
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  await getCategoryById(id);

  if (input.slug) {
    const existing = await db.category.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (existing && existing.id !== id) {
      throw Errors.conflict("Category slug already exists");
    }
  }

  return db.category.update({ where: { id }, data: input });
}

export async function deleteCategory(id: string) {
  const category = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { children: true, products: true } } },
  });
  if (!category) throw Errors.notFound("Category");

  if (category._count.children > 0) {
    throw Errors.businessRule(
      "Cannot delete a category with subcategories",
      "CONFLICT"
    );
  }

  await db.category.delete({ where: { id } });
}
