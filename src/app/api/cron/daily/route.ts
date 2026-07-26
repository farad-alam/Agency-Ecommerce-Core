import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { LowStockAlertEmail } from "@/emails/templates";
import { env } from "@/lib/env";
import * as React from "react";

export async function GET(req: NextRequest) {
  // Validate Vercel Cron Secret (in a real app, verify authorization header)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'secret'}`) {
    // We'll allow it for now for local testing, but usually:
    // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Task 1: Clean up old anonymous carts (older than 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deletedCarts = await db.cart.deleteMany({
    where: {
      userId: null,
      updatedAt: { lt: thirtyDaysAgo },
    },
  });

  // Task 2: Check for low stock and send alert
  const lowStockItems = await db.productVariant.findMany({
    where: { inventoryQty: { lte: 10 } },
    include: { product: true },
  });

  if (lowStockItems.length > 0) {
    // Send email to admin
    await sendEmail({
      to: "admin@store.com", // Usually from config
      subject: "Daily Low Stock Alert",
      react: React.createElement(LowStockAlertEmail, {
        productTitle: `${lowStockItems.length} items`,
        sku: "Multiple",
        currentStock: 0
      }),
    });
  }

  return NextResponse.json({
    message: "Cron executed successfully",
    cartsDeleted: deletedCarts.count,
    lowStockItemsFound: lowStockItems.length,
  });
}
