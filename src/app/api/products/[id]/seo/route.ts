import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { upsertProductSeo } from "@/core/products";
import { handleError } from "@/core/errors/handler";
import { parseBody } from "@/core/api/validate";
import { seoMetaSchema } from "@/core/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const body = await req.json();
    const parsed = parseBody(seoMetaSchema, body);
    if ("error" in parsed) return parsed.error;
    const seo = await upsertProductSeo(id, parsed.data);
    return NextResponse.json(seo);
  } catch (err) {
    return handleError(err);
  }
}
