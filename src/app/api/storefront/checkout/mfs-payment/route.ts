import { NextRequest, NextResponse } from "next/server";
import { submitMfsPayment } from "@/core/mfs";
import { handleError } from "@/core/errors/handler";
import { z } from "zod";
import type { MfsProvider } from "@prisma/client";

const schema = z.object({
  orderId: z.string().min(1),
  provider: z.enum(["BKASH", "NAGAD", "ROCKET"]),
  senderNumber: z.string().min(10).max(15),
  transactionId: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const payment = await submitMfsPayment({
      ...parsed.data,
      provider: parsed.data.provider as MfsProvider,
    });
    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
