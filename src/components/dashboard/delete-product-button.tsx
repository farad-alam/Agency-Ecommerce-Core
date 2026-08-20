"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  id: string;
  title: string;
  currentStatus: string;
}

export function ArchiveProductButton({ id, title, currentStatus }: Props) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const isArchived = currentStatus === "ARCHIVED";

  async function handle(e: React.MouseEvent) {
    e.preventDefault();

    const message = isArchived
      ? `Restore "${title}" and make it visible again?`
      : `Archive "${title}"?\n\nThis will hide it from your store. Your order history will NOT be affected — all past orders remain intact.`;

    if (!confirm(message)) return;

    setIsPending(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isArchived ? "DRAFT" : "ARCHIVED" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Action failed");
      }
      toast.success(isArchived ? "Product restored to Drafts" : "Product archived successfully");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className={`p-2 rounded-lg transition disabled:opacity-50 ${
        isArchived
          ? "text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10"
          : "text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10"
      }`}
      title={isArchived ? "Restore product" : "Archive product"}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isArchived ? (
        <RotateCcw className="h-4 w-4" />
      ) : (
        <Archive className="h-4 w-4" />
      )}
    </button>
  );
}
