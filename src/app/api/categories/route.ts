import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { listAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from "@/core/categories";
import { handleError } from "@/core/errors/handler";
import { parseBody } from "@/core/api/validate";
import { createCategorySchema, updateCategorySchema } from "@/core/api/schemas";

export async function GET() {
  try {
    await requireDashboardAccess();
    const categories = await listAllCategories();
    return NextResponse.json(categories);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireDashboardAccess();
    const body = await req.json();
    const parsed = parseBody(createCategorySchema, body);
    if ("error" in parsed) return parsed.error;
    const category = await createCategory(parsed.data);
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
