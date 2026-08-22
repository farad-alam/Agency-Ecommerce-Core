import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CreditCard, ArrowLeft, AlertCircle, CheckCircle2, XCircle, Phone, Hash, User, Package } from "lucide-react";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { PaymentVerifyRejectClient } from "./payment-verify-reject-client";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_VERIFICATION: { label: "Pending Verification", color: "bg-amber-500/10 text-amber-500 border border-amber-500/20", icon: AlertCircle },
  VERIFIED: { label: "Verified", color: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "bg-red-500/10 text-red-500 border border-red-500/20", icon: XCircle },
};

export default async function PaymentDetailsPage(props: { params: Promise<{ id: string }> }) {
  await requireDashboardAccess();
  const { id } = await props.params;

  const payment = await db.mfsPayment.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          items: true,
          user: true,
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  const statusConf = STATUS_CONFIG[payment.status] || { label: payment.status, color: "bg-gray-100 text-gray-800", icon: AlertCircle };
  const StatusIcon = statusConf.icon;

  let verifierName = null;
  if (payment.verifiedBy) {
    const verifier = await db.user.findUnique({ where: { id: payment.verifiedBy } });
    verifierName = verifier?.name || verifier?.email;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/payments" className="p-2 -ml-2 rounded-md hover:bg-white/[0.05] text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white">Payment Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/[0.08] overflow-hidden">
            <div className="p-6 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-zinc-400" />
                  MFS Payment Submission
                </h2>
                <p className="text-sm text-zinc-400 mt-1">Submitted on {format(new Date(payment.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConf.color}`}>
                <StatusIcon className="w-4 h-4" />
                {statusConf.label}
              </span>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Provider</p>
                  <p className="font-semibold text-lg text-white">{payment.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Phone className="w-4 h-4" /> Sender Number
                  </p>
                  <p className="font-mono text-base bg-zinc-900/50 text-white inline-block px-3 py-1.5 rounded border border-white/[0.08]">{payment.senderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Hash className="w-4 h-4" /> Transaction ID
                  </p>
                  <p className="font-mono text-base bg-zinc-900/50 text-white inline-block px-3 py-1.5 rounded border border-white/[0.08]">{payment.transactionId}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Amount to Verify</p>
                  <p className="font-bold text-2xl text-white">
                    {Number(payment.order.total).toLocaleString()} {payment.order.currency}
                  </p>
                </div>
                {payment.status !== "PENDING_VERIFICATION" && (
                  <div className="pt-4 border-t border-white/[0.08]">
                    <p className="text-sm text-zinc-400 mb-1">
                      {payment.status === "VERIFIED" ? "Verified By" : "Rejected By"}
                    </p>
                    <p className="font-medium text-sm text-white">{verifierName || "Unknown Admin"}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {payment.verifiedAt ? format(new Date(payment.verifiedAt), "MMM d, yyyy h:mm a") : ""}
                    </p>
                    {payment.status === "REJECTED" && payment.rejectionReason && (
                      <div className="mt-3 bg-red-500/10 text-red-400 p-3 rounded-md text-sm border border-red-500/20">
                        <span className="font-semibold block mb-1">Reason:</span>
                        {payment.rejectionReason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Section (Client Component) */}
          {payment.status === "PENDING_VERIFICATION" && (
            <PaymentVerifyRejectClient paymentId={payment.id} orderNumber={payment.order.orderNumber} />
          )}
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
          <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/[0.08] p-6 space-y-4 text-white">
            <h3 className="font-semibold flex items-center gap-2 border-b border-white/[0.08] pb-3 text-white">
              <User className="w-4 h-4 text-zinc-400" /> Customer Details
            </h3>
            {payment.order.user ? (
              <div>
                <p className="font-medium text-white">{payment.order.user.name || "N/A"}</p>
                <p className="text-sm text-zinc-400">{payment.order.user.email}</p>
                {payment.order.user.phone && <p className="text-sm text-zinc-400">{payment.order.user.phone}</p>}
              </div>
            ) : (
              <div>
                <span className="inline-flex items-center rounded-full bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-300 mb-2">Guest Checkout</span>
                <p className="text-sm text-zinc-400">{payment.order.guestEmail}</p>
              </div>
            )}
            
            <div className="pt-3 border-t border-white/[0.08]">
               <p className="text-xs text-zinc-500 mb-1">Billing Address</p>
               <div className="text-sm text-zinc-300">
                 {(() => {
                    const addr = payment.order.billingAddress as any;
                    if (!addr) return "Same as shipping";
                    return (
                      <>
                        <p>{addr.fullName || `${addr.firstName} ${addr.lastName}`}</p>
                        <p>{addr.phone}</p>
                      </>
                    );
                 })()}
               </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-semibold flex items-center gap-2 text-white">
                <Package className="w-4 h-4 text-zinc-400" /> Order {payment.order.orderNumber}
              </h3>
              <Link href={`/dashboard/orders/${payment.orderId}`} className="text-xs text-indigo-600 hover:underline">
                View Order &rarr;
              </Link>
            </div>
            
            <div className="space-y-3">
               {payment.order.items.map((item) => (
                 <div key={item.id} className="flex justify-between text-sm">
                   <div className="flex-1 text-zinc-300">
                     <p className="font-medium truncate pr-2 text-white">{item.productTitle}</p>
                     <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                   </div>
                   <div className="text-right whitespace-nowrap text-white font-medium">
                     {(Number(item.price) * item.quantity).toLocaleString()} {payment.order.currency}
                   </div>
                 </div>
               ))}
            </div>

            <div className="pt-3 border-t border-white/[0.08] space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="text-white">{Number(payment.order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Shipping</span>
                <span className="text-white">{Number(payment.order.shippingTotal).toLocaleString()}</span>
              </div>
              {Number(payment.order.discountTotal) > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>Discount</span>
                  <span>-{Number(payment.order.discountTotal).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t border-white/[0.08] mt-2 text-white">
                <span>Total</span>
                <span>{Number(payment.order.total).toLocaleString()} {payment.order.currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
