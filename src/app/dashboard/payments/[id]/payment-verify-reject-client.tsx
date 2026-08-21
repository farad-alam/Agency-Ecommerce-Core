"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export function PaymentVerifyRejectClient({ paymentId, orderNumber }: { paymentId: string; orderNumber: string }) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleVerify = async () => {
    if (!confirm(`Are you sure you want to verify payment for Order ${orderNumber}? This will mark the order as PAID and notify the customer.`)) return;
    
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/dashboard/payments/${paymentId}/verify`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Failed to verify payment");
      }
      toast.success("Payment verified successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
      setIsVerifying(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    
    if (!confirm(`Are you sure you want to reject this payment? The customer will be notified with the reason provided.`)) return;

    setIsRejecting(true);
    try {
      const res = await fetch(`/api/dashboard/payments/${paymentId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Failed to reject payment");
      }
      toast.success("Payment rejected.");
      setShowRejectForm(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
      setIsRejecting(false);
    }
  };

  if (showRejectForm) {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden mt-6 p-6">
        <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
          <XCircle className="w-5 h-5" /> Reject Payment
        </h3>
        <form onSubmit={handleReject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Rejection</label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid Transaction ID, Amount doesn't match..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            <p className="text-xs text-gray-500 mt-1.5">This reason will be included in the email sent to the customer.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isRejecting}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Rejection"}
            </button>
            <button
              type="button"
              disabled={isRejecting}
              onClick={() => {
                setShowRejectForm(false);
                setRejectReason("");
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden mt-6 p-6">
      <h3 className="font-bold text-gray-900 mb-2">Verification Action Required</h3>
      <p className="text-sm text-gray-600 mb-6">
        Please verify that the payment amount matches the order total and the transaction ID is valid in your MFS portal before approving.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={handleVerify}
          disabled={isVerifying || isRejecting}
          className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {isVerifying ? "Verifying..." : "Verify Payment"}
        </button>
        <button
          onClick={() => setShowRejectForm(true)}
          disabled={isVerifying || isRejecting}
          className="flex-1 bg-white border border-red-200 text-red-600 py-3 px-4 rounded-xl font-medium hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <XCircle className="w-5 h-5" />
          Reject Payment
        </button>
      </div>
    </div>
  );
}
