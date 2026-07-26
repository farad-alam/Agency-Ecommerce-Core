import { Metadata } from "next";
import { requireAdmin } from "@/core/auth/helpers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Payment Providers",
};

export default async function PaymentsSettingsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Payment Providers</h1>
          <p className="text-sm text-zinc-400 mt-1">Configure payment gateways and methods.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-white flex items-center gap-3">
                SSLCommerz
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Coming Soon</Badge>
              </h2>
              <p className="text-sm text-zinc-400 mt-1">Primary payment gateway for Bangladesh.</p>
            </div>
            <Badge variant="outline" className="border-zinc-700 text-zinc-500">Not Configured</Badge>
          </div>
          
          <div className="bg-[#18181b] border border-white/[0.05] rounded-lg p-4 space-y-4 opacity-50 pointer-events-none">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Store ID</label>
              <input 
                type="text" 
                placeholder="e.g., testbox"
                className="w-full bg-black/50 border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Store Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-black/50 border border-white/[0.1] rounded-md px-3 py-2 text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-zinc-700 bg-zinc-800" defaultChecked />
              <label className="text-sm text-zinc-300">Enable Sandbox/Test Mode</label>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-xs text-zinc-500">
              Note: Implementation of the SSLCommerz adapter is scheduled for the end of the project.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
