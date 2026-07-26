import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import {
  getCollectionById,
  updateCollection,
  deleteCollection,
  addProductsToCollection,
  removeProductFromCollection,
} from "@/core/collections";
import { handleError } from "@/core/errors/handler";
import { parseBody } from "@/core/api/validate";
import { updateCollectionSchema } from "@/core/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const collection = await getCollectionById(id);
    return NextResponse.json(collection);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const body = await req.json();
    const parsed = parseBody(updateCollectionSchema, body);
    if ("error" in parsed) return parsed.error;
    const collection = await updateCollection(id, parsed.data);
    return NextResponse.json(collection);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    await deleteCollection(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
