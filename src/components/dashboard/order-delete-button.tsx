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
      disabled
      title="This feature is under development. Because of this, an admin cannot delete an order, but you can use the 'REJECTED' or 'CANCELLED' status."
      className="px-4 py-2 bg-red-500/5 text-red-500/50 border border-red-500/10 font-medium text-sm rounded-md cursor-not-allowed flex items-center gap-2"
    >
      <Trash2 className="w-4 h-4" />
      Delete Order
    </button>
  );
}
