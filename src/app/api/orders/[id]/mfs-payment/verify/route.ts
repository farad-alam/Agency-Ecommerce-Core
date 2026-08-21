import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { verifyMfsPayment, rejectMfsPayment } from "@/core/mfs";
import { handleError } from "@/core/errors/handler";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("VERIFY") }),
  z.object({ action: z.literal("REJECT"), reason: z.string().min(1) }),
]);

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const adminUser = await requireDashboardAccess();
    const { id: orderId } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.action === "VERIFY") {
      const order = await verifyMfsPayment(orderId, adminUser.id);
      return NextResponse.json(order);
    } else {
      await rejectMfsPayment(orderId, parsed.data.reason);
      return NextResponse.json({ ok: true });
    }
  } catch (err) {
    return handleError(err);
  }
}
