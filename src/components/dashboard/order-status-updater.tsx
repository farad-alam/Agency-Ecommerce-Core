"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";

export function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;
    
    // Immediately revert the select UI back to currentStatus
    // We only visually change it AFTER a successful API update.
    e.target.value = currentStatus;
    setPendingStatus(newStatus);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pendingStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Order status updated");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
      setPendingStatus(null);
    }
  };

  return (
    <>
      <div className="relative flex items-center">
        <select
          defaultValue={currentStatus}
          onChange={handleSelectChange}
          disabled={isUpdating}
          className="appearance-none bg-zinc-800 border border-zinc-700 text-white font-medium text-sm rounded-md pl-4 pr-10 py-2 hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
        >
          <option value="PENDING">PENDING</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="PAID">PAID</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="REFUNDED">REFUNDED</option>
          <option value="PARTIALLY_REFUNDED">PARTIALLY REFUNDED</option>
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

      {pendingStatus && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop blur overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setPendingStatus(null)}
          />
          
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md p-6 bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setPendingStatus(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <AlertTriangle className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold text-white tracking-tight">Update Status</h2>
            </div>
            
            <p className="text-zinc-400 leading-relaxed mb-8">
              Are you sure you want to change the order status from <strong className="text-zinc-200 font-medium px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08]">{currentStatus}</strong> to <strong className="text-indigo-400 font-medium px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">{pendingStatus}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setPendingStatus(null)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmStatusChange}
                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
