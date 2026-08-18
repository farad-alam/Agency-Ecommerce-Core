import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { reorderProductMedia } from "@/core/media";
import { handleError } from "@/core/errors/handler";
import { z } from "zod";
import { parseBody } from "@/core/api/validate";

const reorderSchema = z.object({
  orderedMediaIds: z.array(z.string().min(1)),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireDashboardAccess();
    const { id: productId } = await params;
    
    const body = await req.json();
    const parsed = parseBody(reorderSchema, body);
    if ("error" in parsed) return parsed.error;
    
    await reorderProductMedia(productId, parsed.data.orderedMediaIds);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
