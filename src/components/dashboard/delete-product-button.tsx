"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Props {
  id: string;
  title: string;
  currentStatus: string;
}

export function ArchiveProductButton({ id, title, currentStatus }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isArchived = currentStatus === "ARCHIVED";

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
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
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        className={`p-2 rounded-lg transition disabled:opacity-50 ${
          isArchived
            ? "text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10"
            : "text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10"
        }`}
        title={isArchived ? "Restore product" : "Archive product"}
      >
        {isArchived ? (
          <RotateCcw className="h-4 w-4" />
        ) : (
          <Archive className="h-4 w-4" />
        )}
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isArchived ? "Restore Product" : "Archive Product"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isArchived ? (
              <>Are you sure you want to restore <strong>{title}</strong>? It will be moved to your drafts.</>
            ) : (
              <>
                Are you sure you want to archive <strong>{title}</strong>?
                <br /><br />
                This will hide it from your store. Your order history will <strong>NOT</strong> be affected &mdash; all past orders remain intact.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button 
            variant="default" 
            onClick={handleConfirm} 
            disabled={isPending}
            className={isArchived ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isArchived ? (
              <RotateCcw className="mr-2 h-4 w-4" />
            ) : (
              <Archive className="mr-2 h-4 w-4" />
            )}
            {isArchived ? "Restore" : "Archive"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
