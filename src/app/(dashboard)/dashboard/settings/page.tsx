import { Metadata } from "next";
import { requireAdmin } from "@/core/auth/helpers";
import { getStoreSettings } from "@/core/settings";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";

export const metadata: Metadata = {
  title: "Store Settings",
};

export default async function SettingsPage() {
  await requireAdmin();

  const settings = await getStoreSettings();

  return (
    <StoreSettingsForm initialValues={{
      storeName: settings.storeName,
      contactEmail: settings.contactEmail,
      currency: settings.currency,
      timezone: settings.timezone,
      taxMode: settings.taxMode,
      taxRate: settings.taxRate,
      shippingFlatRate: settings.shippingFlatRate,
    }} />
  );
}
