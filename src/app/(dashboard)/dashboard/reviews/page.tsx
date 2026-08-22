import { Metadata } from "next";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { getReviews } from "@/core/reviews";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Construction } from "lucide-react";

export const metadata: Metadata = {
  title: "Reviews Moderation",
};

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  await requireDashboardAccess();

  const { page: pageStr, status } = await searchParams;
  const page = pageStr ? parseInt(pageStr) : 1;
  
  const result = await getReviews({
    page,
    limit: 20,
    status: status,
  }, false);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400 flex items-center gap-2 mb-6">
        <Construction className="w-4 h-4 flex-shrink-0" />
        This module is currently under development. Some features may not be fully functional.
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Reviews Moderation</h1>
      </div>

      <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Reviewer</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Review</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {result.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                result.data.map((review: any) => (
                  <tr key={review.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate">
                      {review.product.title}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {review.name}
                    </td>
                    <td className="px-4 py-3 text-amber-400 font-medium">
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 max-w-md truncate">
                      {review.body || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        review.status === "APPROVED" ? "default" :
                        review.status === "REJECTED" ? "destructive" : "outline"
                      }>
                        {review.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {format(new Date(review.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Interactive Client-side components would handle these API calls */}
                      {review.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <button className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">Approve</button>
                          <button className="text-red-400 hover:text-red-300 text-xs font-medium">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
