import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDashboardAccess } from "@/core/auth/helpers";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDashboardAccess();
    const params = await props.params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 });
    }

    const order = await db.order.findUnique({ where: { id: params.id } });
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: params.id },
        data: { status: body.status },
      });

      await tx.orderStatusEvent.create({
        data: {
          orderId: params.id,
          status: body.status,
          note: `Status updated to ${body.status} by ${user.name || user.email}`,
        }
      });
    });

    return NextResponse.json({ success: true, status: body.status });
  } catch (error: any) {
    console.error("Order status update error:", error);
    return NextResponse.json({ message: error.message || "Failed to update status" }, { status: 500 });
  }
}
