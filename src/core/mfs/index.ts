import { db } from "@/lib/db";
import { Errors } from "@/core/errors";
import type { MfsProvider, MfsPaymentStatus } from "@prisma/client";

// ─── MFS Account Management (Admin) ──────────────────────────────────────────

export async function listMfsAccounts(onlyActive = false) {
  return db.mfsAccount.findMany({
    where: onlyActive ? { isActive: true } : {},
    orderBy: [{ provider: "asc" }, { createdAt: "desc" }],
  });
}

export async function createMfsAccount(data: {
  provider: MfsProvider;
  accountNumber: string;
  accountName?: string;
}) {
  return db.mfsAccount.create({ data });
}

export async function updateMfsAccount(
  id: string,
  data: Partial<{ accountNumber: string; accountName: string; isActive: boolean }>
) {
  const account = await db.mfsAccount.findUnique({ where: { id } });
  if (!account) throw Errors.notFound("MFS Account");
  return db.mfsAccount.update({ where: { id }, data });
}

export async function deleteMfsAccount(id: string) {
  const account = await db.mfsAccount.findUnique({ where: { id } });
  if (!account) throw Errors.notFound("MFS Account");
  await db.mfsAccount.delete({ where: { id } });
}

// ─── MFS Payment Submission (Storefront) ─────────────────────────────────────

export async function submitMfsPayment(data: {
  orderId: string;
  provider: MfsProvider;
  senderNumber: string;
  transactionId: string;
}) {
  // Verify the order exists and has no payment yet
  const order = await db.order.findUnique({
    where: { id: data.orderId },
    include: { mfsPayment: true },
  });
  if (!order) throw Errors.notFound("Order");
  if (order.mfsPayment) {
    throw Errors.conflict("A payment has already been submitted for this order");
  }

  return db.mfsPayment.create({ data });
}

// ─── MFS Payment Verification (Admin) ────────────────────────────────────────

export async function verifyMfsPayment(orderId: string, adminUserId: string) {
  const mfsPayment = await db.mfsPayment.findUnique({ where: { orderId } });
  if (!mfsPayment) throw Errors.notFound("MFS Payment");
  if (mfsPayment.status !== "PENDING_VERIFICATION") {
    throw Errors.conflict("Payment has already been processed");
  }

  // Update MfsPayment + Order status in a single transaction
  await db.$transaction([
    db.mfsPayment.update({
      where: { orderId },
      data: {
        status: "VERIFIED",
        verifiedBy: adminUserId,
        verifiedAt: new Date(),
      },
    }),
    db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "PAID",
        paymentProvider: mfsPayment.provider,
        paymentRef: mfsPayment.transactionId,
      },
    }),
  ]);

  return db.order.findUnique({
    where: { id: orderId },
    include: { mfsPayment: true },
  });
}

export async function rejectMfsPayment(
  orderId: string,
  reason: string
) {
  const mfsPayment = await db.mfsPayment.findUnique({ where: { orderId } });
  if (!mfsPayment) throw Errors.notFound("MFS Payment");
  if (mfsPayment.status !== "PENDING_VERIFICATION") {
    throw Errors.conflict("Payment has already been processed");
  }

  await db.mfsPayment.update({
    where: { orderId },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
    },
  });

  return { ok: true };
}
