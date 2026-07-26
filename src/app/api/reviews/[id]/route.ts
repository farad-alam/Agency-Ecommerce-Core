import { NextRequest, NextResponse } from "next/server";
import { updateReviewStatus } from "@/core/reviews";
import { UpdateReviewStatusInputSchema } from "@/core/reviews/types";
import { withHandler } from "@/core/errors";
import { requireDashboardAccess } from "@/core/auth/helpers";

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireDashboardAccess();
  const { id } = await params;
  
  const body = await req.json();
  const input = UpdateReviewStatusInputSchema.parse(body);

  const updated = await updateReviewStatus(id, input);

  return NextResponse.json({ data: updated });
});
