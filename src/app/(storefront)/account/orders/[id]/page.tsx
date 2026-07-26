import { getMyOrder } from "@/storefront-sdk/orders";
import Link from "next/link";
import { format } from "date-fns";

export default async function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const order = await getMyOrder(params.id);
  const shippingAddress = order.shippingAddress as Record<string, string>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account/orders" className="text-sm text-gray-500 hover:text-black">
          &larr; Back to Orders
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Order {order.orderNumber}</h1>
          <p className="text-gray-500 text-sm">Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>
        <div className="px-4 py-2 bg-gray-100 rounded-full font-medium text-sm self-start md:self-auto">
          Status: {order.status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="font-semibold">Items</h2>
            </div>
            <ul className="divide-y">
              {order.items.map((item: any) => (
                <li key={item.id} className="p-6 flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center text-xs text-gray-400">
                    Img
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{item.productTitle}</h3>
                    <div className="text-sm text-gray-500 mt-1 capitalize">
                      {Object.values(item.variantOptions as Record<string, string> || {}).join(" / ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">BDT {Number(item.price).toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="bg-gray-50 px-6 py-6 border-t space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>BDT {Number(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>BDT {Number(order.shippingTotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>BDT {Number(order.taxTotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-4 mt-4 border-t border-gray-200 text-gray-900">
                <span>Total</span>
                <span>BDT {Number(order.total).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg bg-white p-6">
            <h2 className="font-semibold mb-4">Shipping Address</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{shippingAddress.fullName}</p>
              <p>{shippingAddress.line1}</p>
              {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
              <p>{shippingAddress.city}, {shippingAddress.postalCode}</p>
              <p>{shippingAddress.country}</p>
              <p className="pt-2 mt-2 border-t">Phone: {shippingAddress.phone}</p>
            </div>
          </div>
          
          <div className="border rounded-lg bg-white p-6">
            <h2 className="font-semibold mb-4">Payment Info</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="font-medium text-gray-900">{order.paymentProvider || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-gray-900">{order.paymentStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
