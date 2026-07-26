import { NextRequest, NextResponse } from "next/server";
import { generatePasswordResetToken } from "@/core/auth/flows";
import { ForgotPasswordInputSchema } from "@/core/auth/types";
import { withHandler } from "@/core/errors";
import { authRateLimit } from "@/lib/rate-limit";
import { Errors } from "@/core/errors";

export const POST = withHandler(async (req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await authRateLimit.limit(ip);
  if (!success) {
    throw Errors.businessRule("Too many password reset requests. Please try again later.", "RATE_LIMITED");
  }

  const body = await req.json();
  const input = ForgotPasswordInputSchema.parse(body);

  // Generates token and handles stub email sending
  await generatePasswordResetToken(input);

  // Always return 200 to prevent email enumeration
  return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
});
