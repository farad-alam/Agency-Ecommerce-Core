import { Metadata } from "next";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { OrderForm } from "@/components/dashboard/order-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Order",
};

export default async function NewOrderPage() {
  await requireDashboardAccess();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders" className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Create Manual Order</h1>
      </div>

      <OrderForm mode="create" />
    </div>
  );
}
