import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { updateVariant, deleteVariant } from "@/core/products";
import { handleError } from "@/core/errors/handler";
import { parseBody } from "@/core/api/validate";
import { updateVariantSchema } from "@/core/api/schemas";

type RouteContext = { params: Promise<{ id: string; variantId: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { variantId } = await params;
    const body = await req.json();
    const parsed = parseBody(updateVariantSchema, body);
    if ("error" in parsed) return parsed.error;

    const variant = await updateVariant(variantId, parsed.data);
    return NextResponse.json(variant);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { variantId } = await params;
    await deleteVariant(variantId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
