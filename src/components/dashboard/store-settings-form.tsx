"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SettingsFormProps {
  initialValues: {
    storeName: string;
    contactEmail: string;
    currency: string;
    timezone: string;
    taxMode: string;
    taxRate: number;
    shippingFlatRate: number;
  };
}

export function StoreSettingsForm({ initialValues }: SettingsFormProps) {
  const [form, setForm] = useState(initialValues);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["taxRate", "shippingFlatRate"].includes(name) ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
        <h2 className="text-lg font-medium text-white mb-6">General Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Store Name</label>
            <input
              type="text"
              name="storeName"
              value={form.storeName}
              onChange={handleChange}
              className="w-full bg-[#18181b] border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Contact Email</label>
            <input
              type="email"
              name="contactEmail"
              value={form.contactEmail}
              onChange={handleChange}
              className="w-full bg-[#18181b] border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </Card>

      <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
        <h2 className="text-lg font-medium text-white mb-6">Regional & Financial</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Base Currency</label>
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="w-full bg-[#18181b] border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="BDT">BDT (৳)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Timezone</label>
            <select
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
              className="w-full bg-[#18181b] border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="Asia/Dhaka">Asia/Dhaka</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Tax Mode</label>
            <select
              name="taxMode"
              value={form.taxMode}
              onChange={handleChange}
              className="w-full bg-[#18181b] border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="NONE">No Tax</option>
              <option value="FLAT_RATE">Flat Rate</option>
            </select>
          </div>
          {form.taxMode === "FLAT_RATE" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Tax Rate (%)</label>
              <input
                type="number"
                name="taxRate"
                value={form.taxRate}
                onChange={handleChange}
                className="w-full bg-[#18181b] border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Shipping Flat Rate ({form.currency})</label>
            <input
              type="number"
              name="shippingFlatRate"
              value={form.shippingFlatRate}
              onChange={handleChange}
              className="w-full bg-[#18181b] border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white font-medium text-sm rounded-md hover:bg-indigo-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save Settings
        </button>
      </div>
    </div>
  );
}
