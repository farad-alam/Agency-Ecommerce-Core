import { db } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";
import { CreditCard, Eye, Search, AlertCircle, CheckCircle2, XCircle, MoreHorizontal } from "lucide-react";
import { requireDashboardAccess } from "@/core/auth/helpers";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_VERIFICATION: { label: "Pending", color: "bg-amber-500/10 text-amber-500 border border-amber-500/20", icon: AlertCircle },
  VERIFIED: { label: "Verified", color: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "bg-red-500/10 text-red-500 border border-red-500/20", icon: XCircle },
};

export default async function PaymentsPage(props: {
  searchParams: Promise<{ status?: string; page?: string; search?: string }>;
}) {
  await requireDashboardAccess();
  const searchParams = await props.searchParams;

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const limit = 20;
  const statusFilter = searchParams.status ? { status: searchParams.status as any } : {};
  const searchFilter = searchParams.search
    ? {
        OR: [
          { transactionId: { contains: searchParams.search, mode: "insensitive" as any } },
          { senderNumber: { contains: searchParams.search, mode: "insensitive" as any } },
          { order: { orderNumber: { contains: searchParams.search, mode: "insensitive" as any } } },
        ],
      }
    : {};

  const where = { ...statusFilter, ...searchFilter };

  const [payments, totalCount] = await Promise.all([
    db.mfsPayment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        order: {
          select: { orderNumber: true, total: true, currency: true },
        },
      },
    }),
    db.mfsPayment.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Payments (MFS)</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-black/40 backdrop-blur-xl p-4 rounded-xl border border-white/[0.08]">
        {/* Tabs */}
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Link
            href="/dashboard/payments"
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              !searchParams.status ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            All Payments
          </Link>
          <Link
            href="/dashboard/payments?status=PENDING_VERIFICATION"
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              searchParams.status === "PENDING_VERIFICATION" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            Pending Verification
          </Link>
          <Link
            href="/dashboard/payments?status=VERIFIED"
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              searchParams.status === "VERIFIED" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            Verified
          </Link>
          <Link
            href="/dashboard/payments?status=REJECTED"
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              searchParams.status === "REJECTED" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            Rejected
          </Link>
        </div>

        {/* Search */}
        <form className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            name="search"
            defaultValue={searchParams.search}
            placeholder="Search TrxID, Number, Order..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
        </form>
      </div>

      <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] border-b border-white/[0.08] text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Order & Date</th>
                <th className="px-6 py-4 font-medium">Provider</th>
                <th className="px-6 py-4 font-medium">Sender Number</th>
                <th className="px-6 py-4 font-medium">TrxID</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <CreditCard className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    No payments found matching your criteria.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const statusConf = STATUS_CONFIG[payment.status] || { label: payment.status, color: "bg-zinc-800 text-zinc-400 border border-zinc-700", icon: AlertCircle };
                  const StatusIcon = statusConf.icon;

                  return (
                    <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/dashboard/orders/${payment.orderId}`} className="font-medium text-indigo-400 hover:underline block mb-1">
                          {payment.order.orderNumber}
                        </Link>
                        <span className="text-xs text-zinc-500">{format(new Date(payment.createdAt), "MMM d, h:mm a")}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{payment.provider}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{payment.senderNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-zinc-300">{payment.transactionId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-white">
                        {Number(payment.order.total).toLocaleString()} {payment.order.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/dashboard/payments/${payment.id}`}
                          className="inline-flex items-center justify-center p-2 rounded-md hover:bg-white/[0.05] text-zinc-400 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Link
                  key={i}
                  href={`/dashboard/payments?page=${i + 1}${searchParams.status ? `&status=${searchParams.status}` : ""}${searchParams.search ? `&search=${searchParams.search}` : ""}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                    page === i + 1 ? "bg-indigo-600 text-white border-indigo-600" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {i + 1}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
