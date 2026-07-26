import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { listProducts, createProduct } from "@/core/products";
import { handleError } from "@/core/errors/handler";
import { parseBody, parseQuery } from "@/core/api/validate";
import {
  createProductSchema,
  productListQuerySchema,
} from "@/core/api/schemas";

export async function GET(req: Request) {
  try {
    await requireDashboardAccess();
    const url = new URL(req.url);
    const parsed = parseQuery(productListQuerySchema, url.searchParams);
    if ("error" in parsed) return parsed.error;

    const result = await listProducts(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireDashboardAccess();
    const body = await req.json();
    const parsed = parseBody(createProductSchema, body);
    if ("error" in parsed) return parsed.error;

    const product = await createProduct(parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
