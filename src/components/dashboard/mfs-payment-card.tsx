"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Clock, ShieldCheck, ShieldX } from "lucide-react";
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

const MFS_LABELS: Record<string, { label: string; color: string }> = {
  BKASH:  { label: "bKash",  color: "text-pink-400" },
  NAGAD:  { label: "Nagad",  color: "text-orange-400" },
  ROCKET: { label: "Rocket", color: "text-purple-400" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    icon: <Clock className="h-4 w-4" />,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  VERIFIED: {
    label: "Verified",
    icon: <ShieldCheck className="h-4 w-4" />,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  REJECTED: {
    label: "Rejected",
    icon: <ShieldX className="h-4 w-4" />,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
};

interface MfsPaymentData {
  id: string;
  provider: string;
  senderNumber: string;
  transactionId: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  rejectionReason?: string | null;
  verifiedAt?: string | Date | null;
}

interface Props {
  orderId: string;
  mfsPayment: MfsPaymentData | null;
}

export function MfsPaymentCard({ orderId, mfsPayment }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const router = useRouter();

  if (!mfsPayment) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#18181b] p-5">
        <h3 className="text-sm font-semibold text-white mb-2">Payment</h3>
        <p className="text-sm text-zinc-500">No payment submitted yet by the customer.</p>
      </div>
    );
  }

  const mfs = MFS_LABELS[mfsPayment.provider] ?? { label: mfsPayment.provider, color: "text-zinc-400" };
  const statusConfig = STATUS_CONFIG[mfsPayment.status];

  async function handleVerify() {
    setIsPending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/mfs-payment/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY" }),
      });
      if (!res.ok) throw new Error("Verification failed");
      toast.success("Payment verified! Order is now marked as PAID.");
      router.refresh();
    } catch {
      toast.error("Failed to verify payment. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setIsPending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/mfs-payment/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", reason: rejectReason }),
      });
      if (!res.ok) throw new Error("Rejection failed");
      toast.success("Payment rejected.");
      setRejectOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to reject payment. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#18181b] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Payment Submission</h3>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-zinc-500 text-xs mb-1">Platform</p>
          <p className={`font-semibold ${mfs.color}`}>{mfs.label}</p>
        </div>
        <div>
          <p className="text-zinc-500 text-xs mb-1">Sender Number</p>
          <p className="text-zinc-200 font-mono">{mfsPayment.senderNumber}</p>
        </div>
        <div className="col-span-2">
          <p className="text-zinc-500 text-xs mb-1">Transaction ID</p>
          <p className="text-zinc-200 font-mono text-sm break-all">{mfsPayment.transactionId}</p>
        </div>
        {mfsPayment.rejectionReason && (
          <div className="col-span-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
            <p className="text-zinc-500 text-xs mb-1">Rejection Reason</p>
            <p className="text-rose-300 text-xs">{mfsPayment.rejectionReason}</p>
          </div>
        )}
      </div>

      {mfsPayment.status === "PENDING_VERIFICATION" && (
        <div className="flex gap-2 pt-1 border-t border-white/[0.06]">
          <button
            onClick={handleVerify}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Verify Payment
          </button>

          <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <AlertDialogTrigger
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject Payment</AlertDialogTitle>
                <AlertDialogDescription>
                  Please provide a reason. The customer will see this message.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Transaction ID not found in our records."
                rows={3}
                className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                <Button
                  onClick={handleReject}
                  disabled={isPending || !rejectReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Confirm Rejection
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
