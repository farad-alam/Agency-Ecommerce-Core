"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const MFS_OPTIONS = [
  { value: "BKASH",  label: "bKash",  color: "text-pink-400",   bg: "bg-pink-500/10 border-pink-500/20" },
  { value: "NAGAD",  label: "Nagad",  color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { value: "ROCKET", label: "Rocket", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
];

interface MfsAccount {
  id: string;
  provider: "BKASH" | "NAGAD" | "ROCKET";
  accountNumber: string;
  accountName: string | null;
  isActive: boolean;
}

interface Props {
  initialAccounts: MfsAccount[];
}

export function MfsAccountsManager({ initialAccounts }: Props) {
  const [accounts, setAccounts] = useState<MfsAccount[]>(initialAccounts);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ provider: "BKASH", accountNumber: "", accountName: "" });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleAdd() {
    if (!form.accountNumber.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/mfs-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add account");
      const account = await res.json();
      setAccounts((prev) => [...prev, account]);
      setForm({ provider: "BKASH", accountNumber: "", accountName: "" });
      setAddOpen(false);
      toast.success("MFS account added");
    } catch {
      toast.error("Failed to add account");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(account: MfsAccount) {
    setTogglingId(account.id);
    try {
      const res = await fetch(`/api/settings/mfs-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !account.isActive }),
      });
      if (!res.ok) throw new Error();
      setAccounts((prev) => prev.map((a) => a.id === account.id ? { ...a, isActive: !a.isActive } : a));
      toast.success(account.isActive ? "Account deactivated" : "Account activated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/settings/mfs-accounts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      toast.success("Account removed");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {accounts.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4 text-center">
          No MFS accounts configured yet. Add one below.
        </p>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => {
            const mfs = MFS_OPTIONS.find((m) => m.value === account.provider)!;
            return (
              <div
                key={account.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                  account.isActive ? "bg-white/[0.02] border-white/[0.06]" : "bg-black/20 border-white/[0.03] opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold rounded-full border px-2.5 py-1 ${mfs.bg} ${mfs.color}`}>
                    {mfs.label}
                  </span>
                  <div>
                    <p className="text-sm font-mono text-zinc-200">{account.accountNumber}</p>
                    {account.accountName && (
                      <p className="text-xs text-zinc-500 mt-0.5">{account.accountName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(account)}
                    disabled={togglingId === account.id}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 transition"
                    title={account.isActive ? "Deactivate" : "Activate"}
                  >
                    {togglingId === account.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : account.isActive ? (
                      <ToggleRight className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    disabled={deletingId === account.id}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  >
                    {deletingId === account.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Dialog */}
      <AlertDialog open={addOpen} onOpenChange={setAddOpen}>
        <AlertDialogTrigger className="flex items-center gap-2 h-9 px-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400 hover:text-white text-xs font-medium transition w-full justify-center">
          <Plus className="h-4 w-4" />
          Add MFS Account
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-[#18181b] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Add MFS Account</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Add the mobile banking number where customers should send payments.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Platform</label>
              <div className="flex gap-2">
                {MFS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm((f) => ({ ...f, provider: opt.value }))}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition ${
                      form.provider === opt.value
                        ? `${opt.bg} ${opt.color}`
                        : "border-white/[0.09] bg-white/[0.02] text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Account Number</label>
              <input
                type="text"
                placeholder="e.g. 01700000000"
                value={form.accountNumber}
                onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Display Name <span className="text-zinc-600">(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Shop Name (Personal)"
                value={form.accountName}
                onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <AlertDialogFooter className="border-t border-white/[0.08] mt-2 pt-4">
            <AlertDialogCancel disabled={saving} className="border-white/[0.1] bg-transparent text-white hover:bg-white/[0.05] hover:text-white">Cancel</AlertDialogCancel>
            <Button onClick={handleAdd} disabled={saving || !form.accountNumber.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Account
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
