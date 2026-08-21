import { NextRequest, NextResponse } from "next/server";
import { acceptStaffInvite } from "@/core/auth/flows";
import { AcceptInviteInputSchema } from "@/core/auth/types";
import { withHandler } from "@/core/errors";

export const POST = withHandler(async (req: NextRequest) => {
  const body = await req.json();
  const input = AcceptInviteInputSchema.parse(body);

  const user = await acceptStaffInvite(input);

  return NextResponse.json({ message: "Invite accepted successfully", data: user }, { status: 201 });
});
