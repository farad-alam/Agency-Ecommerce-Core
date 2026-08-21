import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateCart, } from "@/core/cart";
import { validateCoupon } from "@/core/coupons";
import { db } from "@/lib/db";
import { withHandler } from "@/core/errors";
import { z } from "zod";

const SESSION_COOKIE_NAME = "storefront_session_id";

const applySchema = z.object({ code: z.string().min(1) });

/**
 * POST /api/storefront/cart/coupon  — apply a coupon code
 * DELETE /api/storefront/cart/coupon — remove the coupon
 */
export const POST = withHandler(async (req: NextRequest) => {
  const session = await auth();
  const userId = session?.user?.id;
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  const cart = await getOrCreateCart({ userId, sessionId });

  const body = await req.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
  }

  // Validate the coupon (throws a meaningful error if invalid)
  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0
  );
  const validation = await validateCoupon(parsed.data.code, subtotal);

  // Save coupon code on cart
  await db.cart.update({
    where: { id: cart.id },
    data: { couponCode: validation.coupon.code },
  });

  return NextResponse.json({
    coupon: validation.coupon,
    discountAmount: validation.discountAmount,
  });
});

export const DELETE = withHandler(async (req: NextRequest) => {
  const session = await auth();
  const userId = session?.user?.id;
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  const cart = await getOrCreateCart({ userId, sessionId });
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });

  return NextResponse.json({ ok: true });
});
