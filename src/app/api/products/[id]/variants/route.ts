import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { createVariant, updateVariant, deleteVariant } from "@/core/products";
import { handleError } from "@/core/errors/handler";
import { parseBody } from "@/core/api/validate";
import { createVariantSchema, updateVariantSchema } from "@/core/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id: productId } = await params;
    const body = await req.json();
    const parsed = parseBody(createVariantSchema, body);
    if ("error" in parsed) return parsed.error;

    const variant = await createVariant(productId, parsed.data);
    return NextResponse.json(variant, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

// ─── PATCH /api/products/[id]/variants/[variantId] ───────────────────────────

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const url = new URL(req.url);
    const variantId = url.pathname.split("/").pop()!;
    const body = await req.json();
    const parsed = parseBody(updateVariantSchema, body);
    if ("error" in parsed) return parsed.error;

    const variant = await updateVariant(variantId, parsed.data);
    return NextResponse.json(variant);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request) {
  try {
    await requireDashboardAccess();
    // variantId comes from the next segment — handled by separate route
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
