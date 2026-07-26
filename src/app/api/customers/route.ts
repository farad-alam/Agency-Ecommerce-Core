import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/core/customers";
import { withHandler } from "@/core/errors";
import { requireDashboardAccess } from "@/core/auth/helpers";

export const GET = withHandler(async (req: NextRequest) => {
  await requireDashboardAccess();

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || undefined;

  const result = await getCustomers({ page, limit, search });

  return NextResponse.json(result);
});
