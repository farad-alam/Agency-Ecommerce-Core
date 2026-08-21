"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    if (!confirm(`Are you sure you want to change the order status to ${newStatus}?`)) {
      e.target.value = currentStatus;
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Order status updated");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
      e.target.value = currentStatus;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative flex items-center">
      <select
        defaultValue={currentStatus}
        onChange={handleStatusChange}
        disabled={isUpdating}
        className="appearance-none bg-zinc-800 border border-zinc-700 text-white font-medium text-sm rounded-md pl-4 pr-10 py-2 hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
      >
        <option value="PENDING">PENDING</option>
        <option value="PROCESSING">PROCESSING</option>
        <option value="SHIPPED">SHIPPED</option>
        <option value="DELIVERED">DELIVERED</option>
        <option value="CANCELLED">CANCELLED</option>
        <option value="REFUNDED">REFUNDED</option>
        <option value="FULFILLED">FULFILLED</option>
      </select>
      {isUpdating ? (
        <Loader2 className="w-4 h-4 animate-spin absolute right-3 text-zinc-400" />
      ) : (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      )}
    </div>
  );
}
