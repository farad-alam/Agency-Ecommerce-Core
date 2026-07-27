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


