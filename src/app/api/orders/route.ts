import { NextRequest, NextResponse } from "next/server";
import { getOrders } from "@/core/orders";
import { withHandler } from "@/core/errors";
import { requireDashboardAccess } from "@/core/auth/helpers";

export const GET = withHandler(async (req: NextRequest) => {
  await requireDashboardAccess(); // Ensure user is ADMIN or STAFF

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  const result = await getOrders({ page, limit, status, search });

  return NextResponse.json(result);
});
