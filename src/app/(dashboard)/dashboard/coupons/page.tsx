import type { Metadata } from "next";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { listCoupons } from "@/core/coupons";
import { CouponsManager } from "@/components/dashboard/coupons-manager";

export const metadata: Metadata = { title: "Coupons" };

export default async function CouponsPage() {
  await requireDashboardAccess();
  const coupons = await listCoupons();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Coupons</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Create and manage discount codes for your store.
        </p>
      </div>
      <CouponsManager initialCoupons={coupons as any} />
    </div>
  );
}
