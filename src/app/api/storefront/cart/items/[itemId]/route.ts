import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrCreateCart, updateCartItem, removeCartItem } from "@/core/cart";
import { UpdateCartItemInputSchema } from "@/core/cart/types";
import { withHandler, Errors } from "@/core/errors";

const SESSION_COOKIE_NAME = "storefront_session_id";

async function verifyCartOwnership(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!userId && !sessionId) {
    throw Errors.unauthorized("No cart session found");
  }

  const cart = await getOrCreateCart({ userId, sessionId });
  return cart;
}

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) => {
  const cart = await verifyCartOwnership(req);
  const { itemId } = await params;
  const body = await req.json();
  const input = UpdateCartItemInputSchema.parse(body);

  const updatedCart = await updateCartItem(cart.id, itemId, input);
  return NextResponse.json({ data: updatedCart });
});

export const DELETE = withHandler(async (req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) => {
  const cart = await verifyCartOwnership(req);
  const { itemId } = await params;
  
  const updatedCart = await removeCartItem(cart.id, itemId);
  return NextResponse.json({ data: updatedCart });
});
