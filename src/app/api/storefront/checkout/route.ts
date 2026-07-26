import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processCheckout } from "@/core/checkout";
import { CheckoutInputSchema } from "@/core/checkout/types";
import { withHandler, Errors } from "@/core/errors";

const SESSION_COOKIE_NAME = "storefront_session_id";

export const POST = withHandler(async (req: NextRequest) => {
  const session = await auth();
  const userId = session?.user?.id;
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!userId && !sessionId) {
    throw Errors.unauthorized("No active session or cart found");
  }

  const body = await req.json();
  const input = CheckoutInputSchema.parse(body);

  const order = await processCheckout({ userId, sessionId }, input);

  return NextResponse.json(
    { 
      message: "Order placed successfully",
      data: order 
    },
    { status: 201 }
  );
});
