"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  return (
    <div className="container mx-auto px-4 py-32 text-center max-w-lg">
      <div className="flex justify-center mb-6">
        <CheckCircle2 className="w-20 h-20 text-emerald-500" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">Order Confirmed!</h1>
      <p className="text-gray-600 mb-2">Thank you for your purchase.</p>
      {orderNumber && (
        <p className="text-gray-900 font-medium mb-8 bg-gray-50 py-3 rounded-lg border">
          Order Number: {orderNumber}
        </p>
      )}
      <p className="text-sm text-gray-500 mb-10">
        We've received your order and are getting it ready. You'll receive a confirmation email shortly.
      </p>
      
      <Link href="/products" className="bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors inline-block w-full">
        Continue Shopping
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="py-32 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
