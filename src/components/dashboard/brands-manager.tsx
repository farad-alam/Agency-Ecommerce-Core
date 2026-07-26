"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Brand } from "@prisma/client";

type BrandWithCount = Brand & { _count: { products: number } };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

export function BrandsManager({ initialBrands }: { initialBrands: BrandWithCount[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BrandWithCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrandWithCount | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null); setName(""); setSlug(""); setError(null); setOpen(true);
  }
  function openEdit(b: BrandWithCount) {
    setEditTarget(b); setName(b.name); setSlug(b.slug); setError(null); setOpen(true);
  }

  async function handleSave() {
    setError(null); setSaving(true);
    try {
      const res = await fetch(editTarget ? `/api/brands/${editTarget.id}` : "/api/brands", {
        method: editTarget ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      setOpen(false);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(b: BrandWithCount) {
    const res = await fetch(`/api/brands/${b.id}`, { method: "DELETE" });
    if (res.ok) { setDeleteTarget(null); startTransition(() => router.refresh()); }
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#18181b]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <span className="text-sm text-zinc-500">{initialBrands.length} brands</span>
          <Button onClick={openCreate} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-1.5 h-4 w-4" /> Add Brand
          </Button>
        </div>
        {initialBrands.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-600">
            No brands yet.{" "}
            <button onClick={openCreate} className="text-indigo-400 hover:underline">Create one</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] text-left text-xs uppercase tracking-wider text-zinc-600">
                <th className="px-6 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {initialBrands.map((b) => (
                <tr key={b.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-3 font-medium text-zinc-200">{b.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{b.slug}</td>
                  <td className="px-4 py-3 text-zinc-400">{b._count.products}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)} className="h-7 w-7 text-zinc-500 hover:text-zinc-200">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(b)} disabled={b._count.products > 0} className="h-7 w-7 text-zinc-600 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/[0.08] bg-[#18181b] text-white sm:max-w-sm">
          <DialogHeader><DialogTitle>{editTarget ? "Edit Brand" : "New Brand"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Name</Label>
              <Input value={name} onChange={(e) => { setName(e.target.value); if (!editTarget) setSlug(slugify(e.target.value)); }} className="border-white/[0.08] bg-white/[0.04] text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="border-white/[0.08] bg-white/[0.04] font-mono text-sm text-zinc-400" />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving || !name || !slug} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="border-white/[0.08] text-zinc-400">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="border-white/[0.08] bg-[#18181b] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.08] text-zinc-400">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
