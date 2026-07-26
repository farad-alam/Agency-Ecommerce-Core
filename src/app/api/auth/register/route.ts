import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/core/auth/flows";
import { RegisterInputSchema } from "@/core/auth/types";
import { withHandler } from "@/core/errors";

const SESSION_COOKIE_NAME = "storefront_session_id";

import { authRateLimit } from "@/lib/rate-limit";
import { Errors } from "@/core/errors";

export const POST = withHandler(async (req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await authRateLimit.limit(ip);
  if (!success) {
    throw Errors.businessRule("Too many registration attempts. Please try again later.", "RATE_LIMITED");
  }

  const body = await req.json();
  const input = RegisterInputSchema.parse(body);
  
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  const user = await registerUser(input, sessionId);

  return NextResponse.json({ message: "Registration successful", data: user }, { status: 201 });
});
