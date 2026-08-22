import { Metadata } from "next";
import { BarChart3, Construction } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-sm text-zinc-400 mt-1">Track your store's performance and sales metrics.</p>
      </div>

      <div className="flex flex-col items-center justify-center border border-dashed border-white/[0.1] rounded-2xl bg-[#18181b] py-32 px-4 text-center">
        <div className="h-16 w-16 bg-white/[0.04] rounded-full flex items-center justify-center mb-4 border border-white/[0.05]">
          <BarChart3 className="h-8 w-8 text-indigo-400" />
        </div>
        <h2 className="text-lg font-medium text-white mb-2">Advanced Analytics</h2>
        <p className="text-zinc-500 text-sm max-w-sm mb-6">
          The advanced analytics dashboard is currently being built. It will provide deep insights into your revenue, top selling products, and customer behavior.
        </p>
        <div className="inline-flex items-center text-xs text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-full font-medium border border-indigo-400/20">
          <Construction className="w-3.5 h-3.5 mr-1.5" />
          Coming Soon
        </div>
      </div>
    </div>
  );
}
