import { NextRequest, NextResponse } from "next/server";
import { getCustomer } from "@/core/customers";
import { withHandler } from "@/core/errors";
import { requireDashboardAccess } from "@/core/auth/helpers";

export const GET = withHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireDashboardAccess();
  const { id } = await params;
  
  const customer = await getCustomer(id);
  
  return NextResponse.json({ data: customer });
});
