import Link from "next/link";
import { CheckCircle2, Package, ArrowRight, Clock } from "lucide-react";

export default async function CheckoutSuccessPage(props: {
  searchParams: Promise<{ orderNumber?: string; method?: string }>;
}) {
  const searchParams = await props.searchParams;
  const orderNumber = searchParams.orderNumber ?? "—";
  const method = searchParams.method ?? "mfs";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-8">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Order Placed!</h1>
          <p className="text-gray-500">
            Thank you for your order. Your order number is:
          </p>
          <div className="inline-block bg-white border border-gray-200 rounded-xl px-6 py-3 mt-2">
            <span className="text-xl font-mono font-bold text-gray-800">{orderNumber}</span>
          </div>
        </div>

        {/* Payment / COD Notice */}
        {method === "cod" ? (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left space-y-2">
            <div className="flex items-center gap-2 text-blue-700">
              <Package className="w-5 h-5 flex-shrink-0" />
              <p className="font-semibold text-sm">Order Confirmed</p>
            </div>
            <p className="text-sm text-blue-700 leading-relaxed">
              Our team member will call you shortly to confirm your order. Please keep your phone reachable. You will pay for the order when it arrives.
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-700">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <p className="font-semibold text-sm">Payment Verification Pending</p>
            </div>
            <p className="text-sm text-amber-700 leading-relaxed">
              We have received your order and are verifying your payment. You will receive a confirmation email once your payment is verified and your order is confirmed.
            </p>
          </div>
        )}

        {/* What's next */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-left space-y-4">
          <h3 className="font-semibold text-sm text-gray-700">What happens next?</h3>
          <div className="space-y-3">
            {[
              ...(method === "mfs" ? [{ icon: "1", text: "Our team verifies your payment (usually within 1–2 hours)" }] : []),
              { icon: method === "mfs" ? "2" : "1", text: "You receive an email confirmation once verified" },
              { icon: method === "mfs" ? "3" : "2", text: "We prepare and ship your order within 1–2 business days" },
            ].map((step) => (
              <div key={step.icon} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.icon}
                </span>
                <p className="text-sm text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/account/orders"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <Package className="w-4 h-4" />
            View My Orders
          </Link>
          <Link
            href="/products"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Shop More
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
