import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function getStoreSettings() {
  return db.storeSettings.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global" },
  });
}

export async function updateStoreSettings(data: Prisma.StoreSettingsUpdateInput) {
  return db.storeSettings.upsert({
    where: { id: "global" },
    update: data,
    create: { 
      id: "global",
      storeName: data.storeName as string || "Agency Ecommerce",
      contactEmail: data.contactEmail as string || "admin@store.com",
      currency: data.currency as string || "BDT",
      timezone: data.timezone as string || "Asia/Dhaka",
      taxMode: data.taxMode as string || "NONE",
      taxRate: data.taxRate as number || 0,
      shippingFlatRate: data.shippingFlatRate as number || 150,
    },
  });
}
