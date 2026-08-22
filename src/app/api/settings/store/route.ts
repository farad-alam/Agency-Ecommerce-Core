import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/core/errors";
import { requireAdmin } from "@/core/auth/helpers";
import { getStoreSettings, updateStoreSettings } from "@/core/settings";
import { z } from "zod";

const UpdateStoreSettingsSchema = z.object({
  storeName: z.string().min(1),
  contactEmail: z.string().email(),
  currency: z.string().length(3),
  taxRate: z.coerce.number().min(0).max(100),
  taxMode: z.enum(["NONE", "FLAT_RATE", "REGIONAL"]).default("NONE"),
  shippingFlatRate: z.coerce.number().min(0),
  timezone: z.string().min(1),
});

export const GET = withHandler(async (req: NextRequest) => {
  await requireAdmin();
  const settings = await getStoreSettings();
  
  return NextResponse.json({
    data: settings
  });
});

export const PATCH = withHandler(async (req: NextRequest) => {
  await requireAdmin();
  
  const body = await req.json();
  const input = UpdateStoreSettingsSchema.parse(body);

  const updatedSettings = await updateStoreSettings({
    storeName: input.storeName,
    contactEmail: input.contactEmail,
    currency: input.currency,
    taxRate: input.taxRate,
    taxMode: input.taxMode,
    shippingFlatRate: input.shippingFlatRate,
    timezone: input.timezone,
  });

  return NextResponse.json({ 
    message: "Store settings updated successfully",
    data: updatedSettings
  });
});
