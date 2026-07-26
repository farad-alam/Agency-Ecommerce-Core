import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { getCategoryById, updateCategory, deleteCategory } from "@/core/categories";
import { handleError } from "@/core/errors/handler";
import { parseBody } from "@/core/api/validate";
import { updateCategorySchema } from "@/core/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const category = await getCategoryById(id);
    return NextResponse.json(category);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const body = await req.json();
    const parsed = parseBody(updateCategorySchema, body);
    if ("error" in parsed) return parsed.error;
    const category = await updateCategory(id, parsed.data);
    return NextResponse.json(category);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
