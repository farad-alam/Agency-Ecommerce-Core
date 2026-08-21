import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { updateMfsAccount, deleteMfsAccount } from "@/core/mfs";
import { handleError } from "@/core/errors/handler";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  accountNumber: z.string().min(10).max(20).optional(),
  accountName: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const account = await updateMfsAccount(id, parsed.data);
    return NextResponse.json(account);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireDashboardAccess();
    const { id } = await params;
    await deleteMfsAccount(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
