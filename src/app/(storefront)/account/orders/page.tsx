import { getMyOrders } from "@/storefront-sdk/orders";
import Link from "next/link";
import { format } from "date-fns";

export default async function AccountOrdersPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const result = await getMyOrders({ page, limit: 10 });

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account" className="text-sm text-gray-500 hover:text-black">
          &larr; Back to Account
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
      </div>

      {result.data.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-lg border">
          <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
          <Link href="/products" className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {result.data.map((order) => (
            <div key={order.id} className="border rounded-lg overflow-hidden bg-white">
              <div className="bg-gray-50 px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order Placed</p>
                    <p className="font-medium text-sm">{format(new Date(order.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total</p>
                    <p className="font-medium text-sm">BDT {Number(order.total).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order #</p>
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                  </div>
                  <Link href={`/account/orders/${order.id}`} className="text-sm font-medium text-indigo-600 hover:indigo-800 border px-3 py-1.5 rounded-md bg-white">
                    View Details
                  </Link>
                </div>
              </div>
              <div className="px-6 py-6 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="font-medium">
                     Status: <span className="text-gray-900">{order.status}</span>
                   </div>
                 </div>
                 <div className="text-sm text-gray-500">
                    {order.items.length} item(s)
                 </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {result.metadata.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: result.metadata.totalPages }).map((_, i) => (
                <Link
                  key={i + 1}
                  href={`/account/orders?page=${i + 1}`}
                  className={`w-10 h-10 flex items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                    page === i + 1 
                      ? "bg-black text-white border-black" 
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {i + 1}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
