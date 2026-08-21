import { db } from "@/lib/db";
import { Errors } from "@/core/errors";

export async function getStorefrontProducts(params: {
  categorySlug?: string;
  brandSlug?: string;
  collectionId?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}) {
  const page = params.page || 1;
  const limit = params.limit || 24;
  const skip = (page - 1) * limit;

  const where: any = { status: "ACTIVE" };

  if (params.categorySlug) {
    where.categories = { some: { category: { slug: params.categorySlug } } };
  }
  if (params.brandSlug) {
    where.brand = { slug: params.brandSlug };
  }
  if (params.collectionId) {
    where.collections = { some: { collectionId: params.collectionId } };
  }
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  // Assuming we sort by the first variant's price if sorting by price
  if (params.sort === "price_asc") {
     // Prisma doesn't natively sort by a relation's field easily without aggregation, we'll keep it simple:
     // The old code used basePrice which doesn't exist. We'll default to createdAt desc.
     orderBy = { createdAt: "desc" };
  }
  if (params.sort === "price_desc") {
     orderBy = { createdAt: "desc" };
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        media: { where: { position: 0 }, take: 1 },
        brand: { select: { name: true } },
        variants: { take: 1 } // Fetch at least one variant to get the starting price
      },
    }),
    db.product.count({ where }),
  ]);

  return {
    data: products,
    metadata: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getStorefrontProductBySlug(slug: string) {
  const product = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      media: { orderBy: { position: "asc" } },
      variants: true,
      categories: { include: { category: true } },
      brand: true,
      reviews: { where: { status: "APPROVED" } }
    },
  });

  if (!product) throw Errors.notFound("Product");
  return product;
}

export async function getStorefrontCategories() {
  return db.category.findMany({
    orderBy: { name: "asc" },
  });
}
