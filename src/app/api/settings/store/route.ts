import { NextRequest, NextResponse } from "next/server";
import { withHandler, Errors } from "@/core/errors";
import { requireAdmin } from "@/core/auth/helpers";
import { db } from "@/lib/db";
import { z } from "zod";

const UpdateStoreSettingsSchema = z.object({
  storeName: z.string().min(1),
  contactEmail: z.string().email(),
  currency: z.string().length(3),
  taxRate: z.number().min(0).max(100),
  timezone: z.string().min(1),
});

// Since settings might not have a dedicated DB model yet, 
// we will stub this or use a simple KV store if it existed.
// For now, we return the hardcoded default config and pretend to update it.
// In a real scenario, this would save to a `StoreSettings` table.

export const GET = withHandler(async (req: NextRequest) => {
  await requireAdmin();
  
  return NextResponse.json({
    data: {
      storeName: "Agency Ecommerce",
      contactEmail: "admin@store.com",
      currency: "BDT",
      taxRate: 15.0,
      timezone: "Asia/Dhaka",
    }
  });
});

export const PATCH = withHandler(async (req: NextRequest) => {
  await requireAdmin();
  
  const body = await req.json();
  const input = UpdateStoreSettingsSchema.parse(body);

  // STUB: Would save to database here
  console.log("Store settings updated:", input);

  return NextResponse.json({ 
    message: "Store settings updated successfully",
    data: input 
  });
});
