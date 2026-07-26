import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrderStatus } from "@/core/orders";
import { UpdateOrderStatusSchema } from "@/core/orders/types";
import { withHandler } from "@/core/errors";
import { requireDashboardAccess } from "@/core/auth/helpers";

export const GET = withHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireDashboardAccess();
  const { id } = await params;
  
  const order = await getOrder(id);
  
  return NextResponse.json({ data: order });
});

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireDashboardAccess();
  const { id } = await params;
  
  const body = await req.json();
  const input = UpdateOrderStatusSchema.parse(body);
  
  const order = await updateOrderStatus(id, input);
  
  return NextResponse.json({ data: order });
});
