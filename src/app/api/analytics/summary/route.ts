import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/core/analytics";
import { withHandler } from "@/core/errors";
import { requireDashboardAccess } from "@/core/auth/helpers";

export const GET = withHandler(async (req: NextRequest) => {
  await requireDashboardAccess();

  const data = await getAnalyticsSummary();
  
  return NextResponse.json({ data });
});
