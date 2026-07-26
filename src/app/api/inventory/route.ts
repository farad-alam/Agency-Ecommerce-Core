import { NextRequest, NextResponse } from "next/server";
import { getInventory, bulkUpdateInventory } from "@/core/inventory";
import { UpdateInventoryInputSchema } from "@/core/inventory/types";
import { withHandler } from "@/core/errors";
import { requireDashboardAccess } from "@/core/auth/helpers";

export const GET = withHandler(async (req: NextRequest) => {
  await requireDashboardAccess();

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || undefined;
  const lowStock = searchParams.get("lowStock") === "true";

  const result = await getInventory({ page, limit, search, lowStock });
  return NextResponse.json(result);
});

export const PATCH = withHandler(async (req: NextRequest) => {
  await requireDashboardAccess();

  const body = await req.json();
  const input = UpdateInventoryInputSchema.parse(body);

  const result = await bulkUpdateInventory(input);
  return NextResponse.json(result);
});
