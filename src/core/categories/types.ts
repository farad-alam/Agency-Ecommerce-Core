import type { Prisma } from "@prisma/client";

export type CategoryWithChildren = Prisma.CategoryGetPayload<{
  include: {
    children: {
      include: {
        children: true;
        _count: { select: { products: true } };
      };
    };
    parent: { select: { id: true; name: true; slug: true } };
    _count: { select: { products: true; children: true } };
  };
}>;

export type CategoryListItem = Prisma.CategoryGetPayload<{
  include: {
    parent: { select: { id: true; name: true } };
    _count: { select: { products: true; children: true } };
  };
}>;

export interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
}
