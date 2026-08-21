import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { updateCoupon, deleteCoupon } from "@/core/coupons";
import { handleError } from "@/core/errors/handler";
import { z } from "zod";
import type { CouponType } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]).optional(),
  value: z.number().min(0).optional(),
  minSubtotal: z.number().min(0).nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { startsAt, expiresAt, type, ...rest } = parsed.data;
    const coupon = await updateCoupon(id, {
      ...rest,
      ...(type ? { type: type as CouponType } : {}),
      ...(startsAt !== undefined ? { startsAt: startsAt ? new Date(startsAt) : null } : {}),
      ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
    });
    return NextResponse.json(coupon);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    await deleteCoupon(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
