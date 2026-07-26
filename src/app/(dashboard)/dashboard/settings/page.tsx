import { Metadata } from "next";
import { requireAdmin } from "@/core/auth/helpers";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Store Settings",
};

export default async function SettingsPage() {
  await requireAdmin();

  // STUB: Normally fetch from DB
  const settings = {
    storeName: "Agency Ecommerce",
    contactEmail: "admin@store.com",
    currency: "BDT",
    taxRate: 15.0,
    timezone: "Asia/Dhaka",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Store Settings</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage global store configurations.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/settings/payments" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Payment Providers →
          </Link>
          <Link href="/dashboard/settings/team" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Team Settings →
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
          <h2 className="text-lg font-medium text-white mb-6">General Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Store Name</label>
              <input 
                type="text" 
                defaultValue={settings.storeName}
                className="w-full bg-[#18181b] border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Contact Email</label>
              <input 
                type="email" 
                defaultValue={settings.contactEmail}
                className="w-full bg-[#18181b] border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                readOnly
              />
            </div>
          </div>
        </Card>

        <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
          <h2 className="text-lg font-medium text-white mb-6">Regional & Financial</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Base Currency</label>
              <input 
                type="text" 
                defaultValue={settings.currency}
                className="w-full bg-[#18181b] border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Tax Rate (%)</label>
              <input 
                type="number" 
                defaultValue={settings.taxRate}
                className="w-full bg-[#18181b] border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Timezone</label>
              <input 
                type="text" 
                defaultValue={settings.timezone}
                className="w-full bg-[#18181b] border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                readOnly
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <button className="px-4 py-2 bg-indigo-500 text-white font-medium text-sm rounded-md hover:bg-indigo-600 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
