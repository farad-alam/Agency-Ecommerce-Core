"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ToggleRight, ToggleLeft, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  PERCENTAGE:   { label: "% Off",       color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  FIXED:        { label: "Fixed Off",   color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  FREE_SHIPPING:{ label: "Free Ship",   color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
};

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minSubtotal: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
}

interface Props { initialCoupons: Coupon[] }

export function CouponsManager({ initialCoupons }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    code: "", type: "PERCENTAGE", value: "",
    minSubtotal: "", maxUses: "", expiresAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!form.code || !form.value) return;
    setSaving(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: Number(form.value),
          minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : null,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.formErrors?.[0] || "Failed to create coupon");
      }
      const coupon = await res.json();
      setCoupons((p) => [coupon, ...p]);
      setForm({ code: "", type: "PERCENTAGE", value: "", minSubtotal: "", maxUses: "", expiresAt: "" });
      setAddOpen(false);
      toast.success("Coupon created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(c: Coupon) {
    setTogglingId(c.id);
    try {
      const res = await fetch(`/api/coupons/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !c.active }),
      });
      if (!res.ok) throw new Error();
      setCoupons((p) => p.map((x) => x.id === c.id ? { ...x, active: !x.active } : x));
      toast.success(c.active ? "Coupon deactivated" : "Coupon activated");
    } catch { toast.error("Failed"); }
    finally { setTogglingId(null); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCoupons((p) => p.filter((c) => c.id !== id));
      toast.success("Coupon deleted");
    } catch { toast.error("Failed"); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex justify-end">
        <AlertDialog open={addOpen} onOpenChange={setAddOpen}>
          <AlertDialogTrigger className="flex items-center gap-2 h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition">
            <Plus className="h-4 w-4" /> New Coupon
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create Coupon</AlertDialogTitle>
              <AlertDialogDescription>Set up a discount code for your customers.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Code *</label>
                  <input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="SUMMER20" className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-3 py-2 text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Type *</label>
                  <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.09] bg-[#18181b] px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="PERCENTAGE">Percentage %</option>
                    <option value="FIXED">Fixed Amount ৳</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
              </div>
              {form.type !== "FREE_SHIPPING" && (
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">
                    Value * {form.type === "PERCENTAGE" ? "(e.g. 20 for 20%)" : "(amount in BDT)"}
                  </label>
                  <input type="number" min="0" value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                    placeholder={form.type === "PERCENTAGE" ? "20" : "100"} className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Min. Order (BDT)</label>
                  <input type="number" min="0" value={form.minSubtotal} onChange={(e) => setForm(f => ({ ...f, minSubtotal: e.target.value }))}
                    placeholder="0 = no minimum" className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Max Uses</label>
                  <input type="number" min="1" value={form.maxUses} onChange={(e) => setForm(f => ({ ...f, maxUses: e.target.value }))}
                    placeholder="Unlimited" className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Expires At</label>
                <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]" />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <Button onClick={handleCreate} disabled={saving || !form.code || (form.type !== "FREE_SHIPPING" && !form.value)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Table */}
      {coupons.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
          <Tag className="h-10 w-10 opacity-30" />
          <p className="text-sm">No coupon codes yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {coupons.map((c) => {
                const typeConfig = TYPE_LABELS[c.type];
                const isExpired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
                return (
                  <tr key={c.id} className={`group hover:bg-white/[0.02] ${!c.active || isExpired ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-zinc-200">{c.code}</span>
                      {isExpired && <span className="ml-2 text-xs text-rose-400">Expired</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-300">
                      {c.type === "PERCENTAGE" ? `${c.value}%` : c.type === "FREE_SHIPPING" ? "—" : `৳${c.value.toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-400">
                      {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500 text-xs">
                      {c.expiresAt ? format(new Date(c.expiresAt), "MMM d, yyyy") : "Never"}
                    </td>
                    <td className="px-4 py-3.5 text-right flex items-center justify-end gap-1">
                      <button onClick={() => handleToggle(c)} disabled={togglingId === c.id}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 transition" title={c.active ? "Deactivate" : "Activate"}>
                        {togglingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                          c.active ? <ToggleRight className="h-5 w-5 text-emerald-400" /> : <ToggleLeft className="h-5 w-5" />}
                      </button>
                      <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition">
                        {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
