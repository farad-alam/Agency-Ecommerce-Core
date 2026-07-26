"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Layers } from "lucide-react";
import type { Collection } from "@prisma/client";

type CollectionWithCount = Collection & { _count: { products: number } };

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400",
  DRAFT: "bg-zinc-700 text-zinc-400",
  ARCHIVED: "bg-red-500/10 text-red-400",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

export function CollectionsManager({ initialCollections }: { initialCollections: CollectionWithCount[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CollectionWithCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CollectionWithCount | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "ARCHIVED">("DRAFT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null); setTitle(""); setSlug(""); setDescription(""); setStatus("DRAFT"); setError(null); setOpen(true);
  }
  function openEdit(c: CollectionWithCount) {
    setEditTarget(c); setTitle(c.title); setSlug(c.slug); setDescription(c.description ?? "");
    setStatus(c.status as "DRAFT" | "ACTIVE" | "ARCHIVED"); setError(null); setOpen(true);
  }

  async function handleSave() {
    setError(null); setSaving(true);
    try {
      const res = await fetch(editTarget ? `/api/collections/${editTarget.id}` : "/api/collections", {
        method: editTarget ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), slug: slug.trim(), description: description.trim() || undefined, status }),
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

  async function handleDelete(c: CollectionWithCount) {
    const res = await fetch(`/api/collections/${c.id}`, { method: "DELETE" });
    if (res.ok) { setDeleteTarget(null); startTransition(() => router.refresh()); }
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#18181b]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <span className="text-sm text-zinc-500">{initialCollections.length} collections</span>
          <Button onClick={openCreate} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-1.5 h-4 w-4" /> Add Collection
          </Button>
        </div>

        {initialCollections.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-sm text-zinc-600">
            <Layers className="h-8 w-8 text-zinc-700" />
            No collections yet.{" "}
            <button onClick={openCreate} className="text-indigo-400 hover:underline">Create one</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] text-left text-xs uppercase tracking-wider text-zinc-600">
                <th className="px-6 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {initialCollections.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-3 font-medium text-zinc-200">{c.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{c.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{c._count.products}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)} className="h-7 w-7 text-zinc-500 hover:text-zinc-200">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(c)} className="h-7 w-7 text-zinc-600 hover:text-red-400">
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
        <DialogContent className="border-white/[0.08] bg-[#18181b] text-white sm:max-w-md">
          <DialogHeader><DialogTitle>{editTarget ? "Edit Collection" : "New Collection"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Title</Label>
              <Input value={title} onChange={(e) => { setTitle(e.target.value); if (!editTarget) setSlug(slugify(e.target.value)); }} className="border-white/[0.08] bg-white/[0.04] text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="border-white/[0.08] bg-white/[0.04] font-mono text-sm text-zinc-400" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="border-white/[0.08] bg-white/[0.04] text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Status</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-zinc-300">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving || !title || !slug} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
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
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">This will remove the collection. Products will not be deleted.</AlertDialogDescription>
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
