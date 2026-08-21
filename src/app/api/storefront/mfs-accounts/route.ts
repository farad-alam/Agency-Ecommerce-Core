import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withHandler } from "@/core/errors";

// Public endpoint — only exposes provider + accountNumber, nothing sensitive
export const GET = withHandler(async () => {
  const accounts = await db.mfsAccount.findMany({
    where: { isActive: true },
    select: {
      id: true,
      provider: true,
      accountNumber: true,
      accountName: true,
    },
    orderBy: { provider: "asc" },
  });

  return NextResponse.json({ data: accounts });
});
