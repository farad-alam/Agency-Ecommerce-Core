import { db } from "@/lib/db";
import { Errors } from "@/core/errors";
import { CreateReviewInput, UpdateReviewStatusInput, ReviewQueryParams } from "./types";
import { Prisma } from "@prisma/client";

export async function createReview(input: CreateReviewInput, userId?: string) {
  // Validate product exists
  const product = await db.product.findUnique({
    where: { id: input.productId },
  });

  if (!product) {
    throw Errors.notFound("Product");
  }

  // A user can only review a product once (optional rule, implemented here)
  if (userId) {
    const existing = await db.review.findFirst({
      where: { productId: input.productId, userId },
    });
    if (existing) {
      throw Errors.conflict("You have already reviewed this product");
    }
  }

  const review = await db.review.create({
    data: {
      productId: input.productId,
      userId,
      name: input.name,
      rating: input.rating,
      body: input.body,
      status: "PENDING",
    },
  });

  return review;
}

export async function getReviews(params: ReviewQueryParams, requireApproved = false) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.ReviewWhereInput = {};

  if (requireApproved) {
    where.status = "APPROVED";
  } else if (params.status) {
    where.status = params.status as any;
  }

  if (params.productId) {
    where.productId = params.productId;
  }

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where,
      include: {
        product: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.review.count({ where }),
  ]);

  return {
    data: reviews,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateReviewStatus(id: string, input: UpdateReviewStatusInput) {
  const review = await db.review.findUnique({ where: { id } });

  if (!review) {
    throw Errors.notFound("Review");
  }

  const updated = await db.review.update({
    where: { id },
    data: { status: input.status },
  });

  return updated;
}
