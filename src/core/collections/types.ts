import type { Prisma } from "@prisma/client";

export type CollectionWithProducts = Prisma.CollectionGetPayload<{
  include: {
    media: true;
    seo: true;
    products: {
      orderBy: { position: "asc" };
      take: 20;
      include: {
        product: {
          include: {
            variants: { orderBy: { price: "asc" }; take: 1 };
            media: { orderBy: { position: "asc" }; take: 1 };
          };
        };
      };
    };
    _count: { select: { products: true } };
  };
}>;

export type CollectionListItem = Prisma.CollectionGetPayload<{
  include: {
    media: { select: { url: true; alt: true } };
    _count: { select: { products: true } };
  };
}>;

export interface CreateCollectionInput {
  title: string;
  slug: string;
  description?: string;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  sortOrder?: number;
}

export interface UpdateCollectionInput {
  title?: string;
  slug?: string;
  description?: string | null;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  sortOrder?: number;
  mediaId?: string | null;
}
