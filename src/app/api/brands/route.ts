import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { listBrands, createBrand } from "@/core/brands";
import { handleError } from "@/core/errors/handler";
import { parseBody } from "@/core/api/validate";
import { brandSchema } from "@/core/api/schemas";

export async function GET() {
  try {
    await requireDashboardAccess();
    const brands = await listBrands();
    return NextResponse.json(brands);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireDashboardAccess();
    const body = await req.json();
    const parsed = parseBody(brandSchema, body);
    if ("error" in parsed) return parsed.error;
    const brand = await createBrand(parsed.data);
    return NextResponse.json(brand, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
