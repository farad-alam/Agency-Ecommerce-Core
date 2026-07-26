import { NextRequest, NextResponse } from "next/server";
import { getReviews, createReview } from "@/core/reviews";
import { CreateReviewInputSchema } from "@/core/reviews/types";
import { withHandler } from "@/core/errors";
import { auth } from "@/lib/auth";

export const GET = withHandler(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || undefined;
  const productId = searchParams.get("productId") || undefined;

  // If fetching for storefront, only APPROVED. If for admin, allow all.
  // We determine this based on a "dashboard" param or just session
  const isDashboard = searchParams.get("dashboard") === "true";
  
  if (isDashboard) {
    const session = await auth();
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const result = await getReviews({ page, limit, status, productId }, !isDashboard);
  return NextResponse.json(result);
});

export const POST = withHandler(async (req: NextRequest) => {
  const session = await auth();
  const userId = session?.user?.id;

  const body = await req.json();
  const input = CreateReviewInputSchema.parse(body);

  const review = await createReview(input, userId);

  return NextResponse.json({ message: "Review submitted for moderation", data: review }, { status: 201 });
});
