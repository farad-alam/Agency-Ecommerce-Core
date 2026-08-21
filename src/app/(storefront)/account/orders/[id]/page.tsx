import { getMyOrder } from "@/storefront-sdk/orders";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Package, MapPin, CreditCard, Clock, CheckCircle2, XCircle, Truck } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:             { label: "Pending",        color: "bg-yellow-100 text-yellow-800", icon: Clock },
  PAID:                { label: "Paid",            color: "bg-blue-100 text-blue-800",    icon: CheckCircle2 },
  FULFILLED:           { label: "Fulfilled",       color: "bg-green-100 text-green-800",  icon: Package },
  SHIPPED:             { label: "Shipped",         color: "bg-indigo-100 text-indigo-800",icon: Truck },
  CANCELLED:           { label: "Cancelled",       color: "bg-red-100 text-red-800",      icon: XCircle },
  DELIVERED:           { label: "Delivered",       color: "bg-green-100 text-green-800",  icon: CheckCircle2 },
  REFUNDED:            { label: "Refunded",        color: "bg-gray-100 text-gray-600",    icon: CreditCard },
  PARTIALLY_REFUNDED:  { label: "Partial Refund",  color: "bg-gray-100 text-gray-600",    icon: CreditCard },
};

const MFS_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING_VERIFICATION: { label: "Payment Pending Verification", color: "bg-amber-100 text-amber-800" },
  VERIFIED:             { label: "Payment Verified",             color: "bg-green-100 text-green-800"  },
  REJECTED:             { label: "Payment Rejected",             color: "bg-red-100 text-red-800"     },
};

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  let order: any;
  try {
    order = await getMyOrder(id);
  } catch {
    notFound();
  }

  const statusConfig = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-800", icon: Package };
  const StatusIcon = statusConfig.icon;
  const address = order.shippingAddress as Record<string, string>;
  const mfsPayment = order.mfsPayment as any | null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account/orders" className="text-sm text-gray-500 hover:text-black transition-colors">
          ← Back to Orders
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order {order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.color}`}>
          <StatusIcon className="w-4 h-4" />
          {statusConfig.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" /> Items
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item: any) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.productTitle}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {Object.entries((item.variantOptions as Record<string, string>) ?? {})
                        .map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      {" · "}SKU: {item.sku}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">BDT {Number(item.price).toLocaleString()} × {item.quantity}</p>
                    <p className="text-gray-500">BDT {(Number(item.price) * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.statusHistory?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" /> Order Timeline
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                {order.statusHistory.map((event: any, i: number) => {
                  const cfg = STATUS_CONFIG[event.status] ?? { label: event.status, color: "bg-gray-100 text-gray-800", icon: Package };
                  const Icon = cfg.icon;
                  return (
                    <div key={event.id} className={`flex gap-4 ${i !== order.statusHistory.length - 1 ? "pb-4 border-b border-dashed border-gray-100" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{cfg.label}</p>
                        {event.note && <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{format(new Date(event.createdAt), "MMM d, yyyy · h:mm a")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3 text-sm">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>BDT {Number(order.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>BDT {Number(order.shippingTotal).toLocaleString()}</span>
            </div>
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                <span>- BDT {Number(order.discountTotal).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-3 border-t">
              <span>Total</span>
              <span>BDT {Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          {mfsPayment && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
              <h2 className="font-semibold flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-gray-500" /> Payment
              </h2>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${MFS_STATUS_CONFIG[mfsPayment.status]?.color ?? "bg-gray-100 text-gray-800"}`}>
                {MFS_STATUS_CONFIG[mfsPayment.status]?.label ?? mfsPayment.status}
              </span>
              <div className="text-sm space-y-1 pt-1">
                <p className="text-gray-600">Method: <span className="font-medium">{mfsPayment.provider}</span></p>
                <p className="text-gray-600">From: <span className="font-medium">{mfsPayment.senderNumber}</span></p>
                <p className="text-gray-600">TrxID: <span className="font-mono font-medium">{mfsPayment.transactionId}</span></p>
              </div>
              {mfsPayment.rejectionReason && (
                <p className="text-xs text-red-600 border-t pt-2">Reason: {mfsPayment.rejectionReason}</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-2">
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-500" /> Shipping Address
            </h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-medium text-gray-900">{address.fullName}</p>
              <p>{address.line1}</p>
              <p>{address.city}{address.region ? `, ${address.region}` : ""} {address.postalCode}</p>
              <p>{address.country}</p>
              {address.phone && <p className="pt-1">📞 {address.phone}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
