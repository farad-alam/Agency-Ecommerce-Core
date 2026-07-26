import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { listCollections, createCollection } from "@/core/collections";
import { handleError } from "@/core/errors/handler";
import { parseBody } from "@/core/api/validate";
import { createCollectionSchema } from "@/core/api/schemas";

export async function GET(req: Request) {
  try {
    await requireDashboardAccess();
    const url = new URL(req.url);
    const status = url.searchParams.get("status") as "DRAFT" | "ACTIVE" | "ARCHIVED" | null;
    const collections = await listCollections(status ?? undefined);
    return NextResponse.json(collections);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireDashboardAccess();
    const body = await req.json();
    const parsed = parseBody(createCollectionSchema, body);
    if ("error" in parsed) return parsed.error;
    const collection = await createCollection(parsed.data);
    return NextResponse.json(collection, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
