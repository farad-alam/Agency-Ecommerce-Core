import { db } from "@/lib/db";
import { Errors } from "@/core/errors";
import type { CouponType } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CouponValidationResult {
  coupon: {
    id: string;
    code: string;
    type: CouponType;
    value: number;
  };
  discountAmount: number; // The actual ৳ amount to deduct
}

// ─── Validate & calculate discount ───────────────────────────────────────────

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || !coupon.active) {
    throw Errors.businessRule("Coupon code is invalid or inactive", "COUPON_INVALID");
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw Errors.businessRule("This coupon is not yet active", "COUPON_NOT_STARTED");
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw Errors.businessRule("This coupon has expired", "COUPON_EXPIRED");
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw Errors.businessRule("This coupon has reached its usage limit", "COUPON_USAGE_LIMIT");
  }
  if (coupon.minSubtotal !== null && subtotal < Number(coupon.minSubtotal)) {
    throw Errors.businessRule(
      `Minimum order of ${Number(coupon.minSubtotal).toLocaleString()} BDT required for this coupon`,
      "COUPON_MIN_SUBTOTAL"
    );
  }

  let discountAmount = 0;
  const value = Number(coupon.value);

  if (coupon.type === "PERCENTAGE") {
    discountAmount = Math.round((subtotal * value) / 100);
  } else if (coupon.type === "FIXED") {
    discountAmount = Math.min(value, subtotal); // Can't discount more than the order
  } else if (coupon.type === "FREE_SHIPPING") {
    discountAmount = 0; // Handled at shipping level
  }

  return {
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value,
    },
    discountAmount,
  };
}

/**
 * Increment usedCount after successful order. Call this inside the checkout transaction.
 */
export async function incrementCouponUsage(code: string) {
  await db.coupon.update({
    where: { code },
    data: { usedCount: { increment: 1 } },
  });
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export async function listCoupons() {
  return db.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getCoupon(id: string) {
  const coupon = await db.coupon.findUnique({ where: { id } });
  if (!coupon) throw Errors.notFound("Coupon");
  return coupon;
}

export async function createCoupon(data: {
  code: string;
  type: CouponType;
  value: number;
  minSubtotal?: number | null;
  maxUses?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
}) {
  const existing = await db.coupon.findUnique({
    where: { code: data.code.toUpperCase() },
  });
  if (existing) throw Errors.conflict(`Coupon code "${data.code}" already exists`);

  return db.coupon.create({
    data: { ...data, code: data.code.toUpperCase() },
  });
}

export async function updateCoupon(
  id: string,
  data: Partial<{
    code: string;
    type: CouponType;
    value: number;
    minSubtotal: number | null;
    maxUses: number | null;
    startsAt: Date | null;
    expiresAt: Date | null;
    active: boolean;
  }>
) {
  await getCoupon(id);
  if (data.code) data.code = data.code.toUpperCase();
  return db.coupon.update({ where: { id }, data });
}

export async function deleteCoupon(id: string) {
  await getCoupon(id);
  await db.coupon.delete({ where: { id } });
}
