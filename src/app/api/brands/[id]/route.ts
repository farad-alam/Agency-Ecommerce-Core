import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { getBrandById, updateBrand, deleteBrand } from "@/core/brands";
import { handleError } from "@/core/errors/handler";
import { parseBody } from "@/core/api/validate";
import { brandSchema } from "@/core/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const brand = await getBrandById(id);
    return NextResponse.json(brand);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const body = await req.json();
    const parsed = parseBody(brandSchema.partial(), body);
    if ("error" in parsed) return parsed.error;
    const brand = await updateBrand(id, parsed.data);
    return NextResponse.json(brand);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    await deleteBrand(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
