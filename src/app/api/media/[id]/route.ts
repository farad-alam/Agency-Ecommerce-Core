import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { deleteMedia } from "@/core/media";
import { handleError } from "@/core/errors/handler";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    await deleteMedia(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
