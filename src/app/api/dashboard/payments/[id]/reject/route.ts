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
    const body = await request.json();

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

    if (mfsPayment.status === "REJECTED") {
      return NextResponse.json({ message: "Payment already rejected" }, { status: 400 });
    }

    const rejectionReason = body.reason || "Unable to verify transaction details.";

    // Run within a transaction
    await db.$transaction(async (tx) => {
      // Mark MfsPayment as rejected
      await tx.mfsPayment.update({
        where: { id: params.id },
        data: {
          status: "REJECTED",
          verifiedBy: user.id,
          verifiedAt: new Date(),
          rejectionReason,
        }
      });

      // We do NOT cancel the order automatically. The admin or customer can retry payment or cancel manually.
      // But we can add an event note.
      await tx.orderStatusEvent.create({
        data: {
          orderId: mfsPayment.orderId,
          status: mfsPayment.order.status,
          note: `MFS Payment rejected by ${user.name}. Reason: ${rejectionReason}`,
        }
      });
    });

    // Send email to customer (fire and forget)
    const customerEmail = mfsPayment.order.guestEmail || mfsPayment.order.user?.email;
    if (customerEmail) {
      sendEmail({
        to: customerEmail,
        subject: `Issue with Payment for Order ${mfsPayment.order.orderNumber}`,
        react: React.createElement('div', null,
          React.createElement('h2', null, `Issue with Payment`),
          React.createElement('p', null, `We were unable to verify your payment for Order ${mfsPayment.order.orderNumber}.`),
          React.createElement('p', null, `Reason: ${rejectionReason}`),
          React.createElement('p', null, `Please contact our support team or reply to this email to resolve this issue so we can process your order.`)
        )
      }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Payment reject error:", error);
    return NextResponse.json({ message: error.message || "Failed to reject payment" }, { status: 500 });
  }
}
