import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/core/auth/flows";
import { RegisterInputSchema } from "@/core/auth/types";
import { withHandler } from "@/core/errors";

const SESSION_COOKIE_NAME = "storefront_session_id";

export const POST = withHandler(async (req: NextRequest) => {
  const body = await req.json();
  const input = RegisterInputSchema.parse(body);
  
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  const user = await registerUser(input, sessionId);

  return NextResponse.json({ message: "Registration successful", data: user }, { status: 201 });
});
