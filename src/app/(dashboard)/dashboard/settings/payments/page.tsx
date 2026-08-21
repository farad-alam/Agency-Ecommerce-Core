import { Metadata } from "next";
import { requireAdmin } from "@/core/auth/helpers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listMfsAccounts } from "@/core/mfs";
import { MfsAccountsManager } from "@/components/dashboard/mfs-accounts-manager";

export const metadata: Metadata = {
  title: "Payment Settings",
};

export default async function PaymentsSettingsPage() {
  await requireAdmin();
  const mfsAccounts = await listMfsAccounts();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Payment Settings</h1>
          <p className="text-sm text-zinc-400 mt-1">Configure how customers can pay for their orders.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* MFS Manual Payment */}
        <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-medium text-white flex items-center gap-3">
                Mobile Banking (MFS)
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Active</Badge>
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Customers can pay via bKash, Nagad, or Rocket and submit their transaction ID for verification.
              </p>
            </div>
          </div>

          <div className="mt-2 mb-5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 px-4 py-3 text-xs text-indigo-300">
            <strong>How it works:</strong> Add your payment numbers below. At checkout, customers will see these numbers, send money to the right one, then enter their sender number and transaction ID. You verify or reject each payment manually from the order page.
          </div>

          <MfsAccountsManager initialAccounts={mfsAccounts as any} />
        </Card>

        {/* SSLCommerz - coming soon */}
        <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 opacity-60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-white flex items-center gap-3">
                SSLCommerz
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Coming Soon</Badge>
              </h2>
              <p className="text-sm text-zinc-400 mt-1">Primary card payment gateway for Bangladesh.</p>
            </div>
            <Badge variant="outline" className="border-zinc-700 text-zinc-500">Not Configured</Badge>
          </div>
          <p className="text-xs text-zinc-500">
            SSLCommerz integration is planned for a future release. This will enable card payments, net banking, and wallet payments.
          </p>
        </Card>
      </div>
    </div>
  );
}
