import { NextRequest, NextResponse } from "next/server";
import { inviteStaff } from "@/core/auth/flows";
import { InviteStaffInputSchema } from "@/core/auth/types";
import { withHandler } from "@/core/errors";
import { requireAdmin } from "@/core/auth/helpers";
import { auth } from "@/lib/auth";

export const POST = withHandler(async (req: NextRequest) => {
  await requireAdmin();
  
  const session = await auth();
  const inviterId = session!.user!.id!;

  const body = await req.json();
  const input = InviteStaffInputSchema.parse(body);

  const invite = await inviteStaff(input, inviterId);

  return NextResponse.json({ message: "Invite sent successfully", data: invite }, { status: 201 });
});
