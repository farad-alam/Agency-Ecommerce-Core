import { NextRequest, NextResponse } from "next/server";
import { withHandler, Errors } from "@/core/errors";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { db } from "@/lib/db";

export const POST = withHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireDashboardAccess();
  const { id } = await params;
  
  const body = await req.json();
  const amount = body.amount;
  
  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw Errors.validation({ amount: ["Amount must be a positive number"] });
  }

  const order = await db.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw Errors.notFound("Order");
  }

  // Create a refund record (stub - in reality this would talk to SSLCommerz API first)
  const refund = await db.$transaction(async (tx) => {
    const newRefund = await tx.refund.create({
      data: {
        orderId: id,
        amount,
        reason: body.reason || "Manual refund",
        status: "COMPLETED", // Assuming manual for now
      },
    });

    // Update order status if necessary
    const totalRefunded = await tx.refund.aggregate({
      where: { orderId: id, status: "COMPLETED" },
      _sum: { amount: true },
    });
    
    const currentTotalRefunded = Number(totalRefunded._sum.amount || 0) + amount;
    const orderTotal = Number(order.total);
    
    let newStatus = order.status;
    if (currentTotalRefunded >= orderTotal) {
      newStatus = "REFUNDED";
    } else if (currentTotalRefunded > 0) {
      newStatus = "PARTIALLY_REFUNDED";
    }

    if (newStatus !== order.status) {
      await tx.order.update({
        where: { id },
        data: { status: newStatus },
      });
      
      await tx.orderStatusEvent.create({
        data: {
          orderId: id,
          status: newStatus,
          note: `System: Order status updated due to refund of ${amount} ${order.currency}`,
        }
      });
    }

    return newRefund;
  });

  return NextResponse.json({ message: "Refund processed successfully", data: refund });
});
