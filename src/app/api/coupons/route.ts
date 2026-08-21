import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { listCoupons, createCoupon } from "@/core/coupons";
import { handleError } from "@/core/errors/handler";
import { z } from "zod";
import type { CouponType } from "@prisma/client";

const createSchema = z.object({
  code: z.string().min(2).max(50),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().min(0),
  minSubtotal: z.number().min(0).nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  try {
    await requireDashboardAccess();
    return NextResponse.json(await listCoupons());
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireDashboardAccess();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { startsAt, expiresAt, ...rest } = parsed.data;
    const coupon = await createCoupon({
      ...rest,
      type: rest.type as CouponType,
      startsAt: startsAt ? new Date(startsAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
