import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { sendEmail } from "@/lib/email";
import * as React from "react";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDashboardAccess();
    const params = await props.params;

    const mfsPayment = await db.mfsPayment.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            user: true,
          }
        },
      }
    });

    if (!mfsPayment) {
      return NextResponse.json({ message: "Payment not found" }, { status: 404 });
    }

    if (mfsPayment.status === "VERIFIED") {
      return NextResponse.json({ message: "Payment already verified" }, { status: 400 });
    }

    // Run within a transaction
    await db.$transaction(async (tx) => {
      // Mark MfsPayment as verified
      await tx.mfsPayment.update({
        where: { id: params.id },
        data: {
          status: "VERIFIED",
          verifiedBy: user.id,
          verifiedAt: new Date(),
        }
      });

      // Mark Order as PAID
      await tx.order.update({
        where: { id: mfsPayment.orderId },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
        }
      });

      // Add Order Status Event
      await tx.orderStatusEvent.create({
        data: {
          orderId: mfsPayment.orderId,
          status: "PAID",
          note: `MFS Payment verified by ${user.name}`,
        }
      });
    });

    // Send email to customer (fire and forget)
    const customerEmail = mfsPayment.order.guestEmail || mfsPayment.order.user?.email;
    if (customerEmail) {
      sendEmail({
        to: customerEmail,
        subject: `Payment Verified for Order ${mfsPayment.order.orderNumber}`,
        react: React.createElement('div', null, 
          React.createElement('h2', null, `Payment Verified`),
          React.createElement('p', null, `Great news! We have successfully verified your payment of BDT ${Number(mfsPayment.order.total)} via ${mfsPayment.provider}. Your order is now confirmed and will be processed shortly.`)
        )
      }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Payment verify error:", error);
    return NextResponse.json({ message: error.message || "Failed to verify payment" }, { status: 500 });
  }
}
