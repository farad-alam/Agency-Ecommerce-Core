import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { listMfsAccounts, createMfsAccount } from "@/core/mfs";
import { handleError } from "@/core/errors/handler";
import { z } from "zod";
import type { MfsProvider } from "@prisma/client";

const createSchema = z.object({
  provider: z.enum(["BKASH", "NAGAD", "ROCKET"]),
  accountNumber: z.string().min(10).max(20),
  accountName: z.string().max(100).optional(),
});

export async function GET() {
  try {
    await requireDashboardAccess();
    const accounts = await listMfsAccounts();
    return NextResponse.json(accounts);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireDashboardAccess();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const account = await createMfsAccount({
      ...parsed.data,
      provider: parsed.data.provider as MfsProvider,
    });
    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
