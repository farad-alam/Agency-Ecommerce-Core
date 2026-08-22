import { Metadata } from "next";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { getOrder } from "@/core/orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { MfsPaymentCard } from "@/components/dashboard/mfs-payment-card";
import { OrderStatusUpdater } from "@/components/dashboard/order-status-updater";
import { OrderDeleteButton } from "@/components/dashboard/order-delete-button";

export const metadata: Metadata = {
  title: "Order Details",
};

export default async function OrderDetailsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  await requireDashboardAccess();

  const order = await getOrder(params.id);
  const shippingAddress = order.shippingAddress as Record<string, string>;
  const billingAddress = order.billingAddress as Record<string, string> | null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
            {order.orderNumber}
            <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            disabled
            title="This feature is under development."
            className="px-4 py-2 bg-indigo-600/10 text-indigo-400/50 border border-indigo-500/20 font-medium text-sm rounded-md cursor-not-allowed"
          >
            Edit Order
          </button>
          {/* Real app uses client component for interactive refund flow */}
          {order.paymentStatus === "PAID" && !["REFUNDED", "CANCELLED"].includes(order.status) && (
            <button className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white font-medium text-sm rounded-md hover:bg-zinc-700 transition-colors">
              Process Refund
            </button>
          )}
          <OrderDeleteButton orderId={order.id} orderNumber={order.orderNumber} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Line Items</h2>
            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-start py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="font-medium text-zinc-200">{item.productTitle}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-200">{Number(item.price).toLocaleString()} {order.currency} × {item.quantity}</p>
                    <p className="font-medium text-white mt-0.5">{(Number(item.price) * item.quantity).toLocaleString()} {order.currency}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-white/[0.08] pt-4 space-y-2">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotal</span>
                <span>{Number(order.subtotal).toLocaleString()} {order.currency}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Shipping</span>
                <span>{Number(order.shippingTotal).toLocaleString()} {order.currency}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Tax</span>
                <span>{Number(order.taxTotal).toLocaleString()} {order.currency}</span>
              </div>
              <div className="flex justify-between text-base font-medium text-white pt-2 border-t border-white/[0.04]">
                <span>Total</span>
                <span>{Number(order.total).toLocaleString()} {order.currency}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
            <h2 className="text-sm font-medium text-white mb-3">Customer</h2>
            {order.user ? (
              <div>
                <p className="text-sm text-zinc-300">{order.user.name}</p>
                <p className="text-sm text-indigo-400">{order.user.email}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-zinc-300">Guest Checkout</p>
                <p className="text-sm text-indigo-400">{order.guestEmail}</p>
              </div>
            )}
          </Card>

          <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
            <h2 className="text-sm font-medium text-white mb-3">Shipping Address</h2>
            <div className="text-sm text-zinc-400 space-y-1">
              <p>{shippingAddress?.line1}</p>
              {shippingAddress?.line2 && <p>{shippingAddress.line2}</p>}
              <p>{shippingAddress?.city}, {shippingAddress?.region} {shippingAddress?.postalCode}</p>
              <p>{shippingAddress?.country}</p>
              {shippingAddress?.phone && <p>Phone: {shippingAddress.phone}</p>}
            </div>
          </Card>

          <MfsPaymentCard orderId={order.id} mfsPayment={order.mfsPayment} />
        </div>
      </div>
    </div>
  );
}
