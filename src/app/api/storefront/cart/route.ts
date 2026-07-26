import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrCreateCart, addToCart } from "@/core/cart";
import { CartItemInputSchema } from "@/core/cart/types";
import { withHandler } from "@/core/errors";

const SESSION_COOKIE_NAME = "storefront_session_id";

function getCartIdentity(req: NextRequest) {
  const sessionIdCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  return sessionIdCookie;
}

export const GET = withHandler(async (req: NextRequest) => {
  const session = await auth();
  const userId = session?.user?.id;
  let sessionId = getCartIdentity(req);

  if (!userId && !sessionId) {
    // Generate a new session id and set cookie
    sessionId = crypto.randomUUID();
    (await cookies()).set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  const cart = await getOrCreateCart({ userId, sessionId });
  return NextResponse.json({ data: cart });
});

export const POST = withHandler(async (req: NextRequest) => {
  const session = await auth();
  const userId = session?.user?.id;
  let sessionId = getCartIdentity(req);

  if (!userId && !sessionId) {
    sessionId = crypto.randomUUID();
    (await cookies()).set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  // Ensure cart exists to get the ID
  const cart = await getOrCreateCart({ userId, sessionId });

  const body = await req.json();
  const input = CartItemInputSchema.parse(body);

  const updatedCart = await addToCart(cart.id, input);

  return NextResponse.json({ data: updatedCart });
});
