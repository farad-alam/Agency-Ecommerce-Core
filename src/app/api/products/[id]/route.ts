import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import {
  getProductById,
  updateProduct,
  archiveProduct,
} from "@/core/products";
import { handleError } from "@/core/errors/handler";
import { parseBody } from "@/core/api/validate";
import { updateProductSchema } from "@/core/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const product = await getProductById(id);
    return NextResponse.json(product);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const body = await req.json();
    const parsed = parseBody(updateProductSchema, body);
    if ("error" in parsed) return parsed.error;

    const product = await updateProduct(id, parsed.data);
    return NextResponse.json(product);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    await archiveProduct(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
