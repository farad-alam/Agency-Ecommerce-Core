import { Metadata } from "next";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { getOrder } from "@/core/orders";
import { OrderForm } from "@/components/dashboard/order-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Order",
};

export default async function EditOrderPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireDashboardAccess();
  const params = await props.params;

  try {
    const order = await getOrder(params.id);
    
    // Pass the raw data down to the client component
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/orders/${order.id}`} className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
            Edit Order {order.orderNumber}
          </h1>
        </div>

        <OrderForm mode="edit" initialData={order} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
