import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/core/auth/flows";
import { ResetPasswordInputSchema } from "@/core/auth/types";
import { withHandler } from "@/core/errors";

export const POST = withHandler(async (req: NextRequest) => {
  const body = await req.json();
  const input = ResetPasswordInputSchema.parse(body);

  await resetPassword(input);

  return NextResponse.json({ message: "Password reset successful." });
});
