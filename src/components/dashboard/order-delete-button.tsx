"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export function OrderDeleteButton({ orderId, orderNumber }: { orderId: string, orderNumber: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`WARNING: Are you sure you want to permanently delete order ${orderNumber}? This action cannot be undone and will delete all associated records.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete order");
      toast.success("Order deleted successfully");
      router.push("/dashboard/orders");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 font-medium text-sm rounded-md hover:bg-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
    >
      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Delete Order
    </button>
  );
}
