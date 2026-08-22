"use client";

import { useCart } from "@/components/storefront/cart-provider";
import { submitCheckout } from "@/storefront-sdk/checkout";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight, CheckCircle2, Phone, Hash } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

type MfsProvider = "BKASH" | "NAGAD" | "ROCKET";
type MfsAccount = { id: string; provider: MfsProvider; accountNumber: string; accountName?: string };

const MFS_META: Record<MfsProvider, { label: string; color: string; bg: string; border: string; textColor: string }> = {
  BKASH: {
    label: "bKash",
    color: "#E2136E",
    bg: "bg-pink-50",
    border: "border-pink-400",
    textColor: "text-pink-700",
  },
  NAGAD: {
    label: "Nagad",
    color: "#F05A22",
    bg: "bg-orange-50",
    border: "border-orange-400",
    textColor: "text-orange-700",
  },
  ROCKET: {
    label: "Rocket",
    color: "#8B14A3",
    bg: "bg-purple-50",
    border: "border-purple-400",
    textColor: "text-purple-700",
  },
};

export default function CheckoutPage() {
  const { cart, isLoading, refreshCart, subtotal, discountAmount, shippingCost, total, couponCode } = useCart();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    district: "Dhaka",
    postalCode: "",
    phone: "",
  });

  const [mfsAccounts, setMfsAccounts] = useState<MfsAccount[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<MfsProvider | null>(null);
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "MFS">("COD");

  const selectedAccount = mfsAccounts.find((a) => a.provider === selectedProvider);

  useEffect(() => {
    fetch("/api/storefront/mfs-accounts")
      .then((r) => r.json())
      .then((data) => {
        setMfsAccounts(data.data ?? []);
        if (data.data?.length > 0) setSelectedProvider(data.data[0].provider);
      })
      .catch(() => {});
  }, []);

  const redirectIfEmpty = useCallback(() => {
    if (isSubmitting) return;
    if (!isLoading && (!cart || cart.items.length === 0)) {
      router.push("/cart");
    }
  }, [isLoading, cart, router, isSubmitting]);

  useEffect(() => {
    redirectIfEmpty();
  }, [redirectIfEmpty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "MFS" && (!selectedProvider || !senderNumber || !transactionId)) {
      toast.error("Please complete the payment details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const address = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        line1: formData.address,
        city: formData.city,
        region: formData.district,
        postalCode: formData.postalCode,
        country: "Bangladesh",
        phone: formData.phone,
      };

      const payload: any = {
        guestEmail: formData.email,
        shippingAddress: address,
        billingAddress: address,
        paymentMethod: paymentMethod,
      };

      if (paymentMethod === "MFS") {
        payload.mfsPayment = {
          provider: selectedProvider,
          senderNumber,
          transactionId,
        };
      }

      const order = await submitCheckout(payload);

      await refreshCart();
      router.push(`/checkout/success?orderNumber=${order.orderNumber}&method=${paymentMethod.toLowerCase()}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to place order. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoading || !cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/cart" className="hover:text-black transition-colors">Cart</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-black font-medium">Checkout</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col-reverse lg:flex-row gap-10 max-w-6xl mx-auto">

          {/* ─── Form ─── */}
          <div className="flex-1 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Contact */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">1</span>
                  Contact Information
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="01XXXXXXXXX"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                  />
                </div>
              </section>

              {/* Shipping Address */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">2</span>
                  Shipping Address
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "First Name", name: "firstName", type: "text", placeholder: "Rahim" },
                    { label: "Last Name", name: "lastName", type: "text", placeholder: "Uddin" },
                  ].map((f) => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                      <input
                        required
                        type={f.type}
                        name={f.name}
                        value={(formData as any)[f.name]}
                        onChange={handleInputChange}
                        placeholder={f.placeholder}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                      />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                    <input
                      required
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="House no, Road, Area"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <input
                      required
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Dhaka"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">District</label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 bg-white"
                    >
                      {["Dhaka","Chattogram","Khulna","Rajshahi","Sylhet","Barisal","Rangpur","Mymensingh","Gazipur","Narayanganj","Comilla","Narsingdi","Bogra","Dinajpur","Jessore"].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="1207"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                    />
                  </div>
                </div>
              </section>

              {/* MFS Payment */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">3</span>
                  Payment
                </h2>

                {/* Method selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === "COD" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">Cash on Delivery</span>
                      {paymentMethod === "COD" && <CheckCircle2 className="w-5 h-5 text-black" />}
                    </div>
                    <span className="text-xs text-gray-500">Pay when your order arrives</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("MFS")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === "MFS" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">Mobile Banking</span>
                      {paymentMethod === "MFS" && <CheckCircle2 className="w-5 h-5 text-black" />}
                    </div>
                    <span className="text-xs text-gray-500">Pay now via bKash, Nagad, etc.</span>
                  </button>
                </div>

                {paymentMethod === "MFS" && (
                  mfsAccounts.length === 0 ? (
                    <p className="text-sm text-gray-500">No payment methods configured. Please contact the store.</p>
                  ) : (
                    <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                    {/* Provider selector */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
                      <div className="grid grid-cols-3 gap-3">
                        {mfsAccounts.map((account) => {
                          const meta = MFS_META[account.provider];
                          const isSelected = selectedProvider === account.provider;
                          return (
                            <button
                              key={account.provider}
                              type="button"
                              onClick={() => setSelectedProvider(account.provider)}
                              className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                isSelected ? `${meta.border} ${meta.bg}` : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <CheckCircle2 className={`absolute top-2 right-2 w-4 h-4 ${meta.textColor}`} />
                              )}
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm"
                                style={{ backgroundColor: meta.color }}
                              >
                                {meta.label.charAt(0)}
                              </div>
                              <span className={`text-xs font-semibold ${isSelected ? meta.textColor : "text-gray-700"}`}>
                                {meta.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Payment instructions */}
                    {selectedAccount && (
                      <div className={`rounded-xl p-4 border ${MFS_META[selectedAccount.provider].bg} ${MFS_META[selectedAccount.provider].border}`}>
                        <p className="text-sm font-semibold mb-2" style={{ color: MFS_META[selectedAccount.provider].color }}>
                          Send money to this {MFS_META[selectedAccount.provider].label} number:
                        </p>
                        <div className="flex items-center gap-2 mb-1">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-lg font-bold tracking-wider">{selectedAccount.accountNumber}</span>
                        </div>
                        {selectedAccount.accountName && (
                          <p className="text-xs text-gray-500">Account: {selectedAccount.accountName}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-2">
                          Send exactly <strong>BDT {total.toLocaleString()}</strong> and enter your transaction details below.
                        </p>
                      </div>
                    )}

                    {/* Sender number + TrxID */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                          <Phone className="w-4 h-4" /> Your {selectedProvider ? MFS_META[selectedProvider].label : "MFS"} Number
                        </label>
                        <input
                          required
                          type="tel"
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                          <Hash className="w-4 h-4" /> Transaction ID (TrxID)
                        </label>
                        <input
                          required
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. 8N2XXXXXX"
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                        />
                      </div>
                    </div>
                    </div>
                  )
                )}
              </section>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || (paymentMethod === "MFS" && mfsAccounts.length === 0)}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-base hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSubmitting ? "Placing Order..." : `Place Order — BDT ${total.toLocaleString()}`}
              </button>
            </form>
          </div>

          {/* ─── Order Summary Sidebar ─── */}
          <div className="w-full lg:w-[420px] flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:sticky lg:top-24 space-y-5">
              <h2 className="text-base font-bold">Order Summary</h2>

              <div className="space-y-4">
                {cart.items.map((item: any) => {
                  const imageUrl = item.variant?.product?.media?.[0]?.url;
                  const price = Number(item.variant?.price ?? 0);
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {imageUrl ? (
                          <Image src={imageUrl} alt={item.productTitle} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No img</div>
                        )}
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full text-[10px] flex items-center justify-center font-bold z-10">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{item.productTitle}</p>
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">
                          {Object.values((item.variant?.options as Record<string, string>) ?? {}).join(" / ")}
                        </p>
                      </div>
                      <div className="text-sm font-semibold whitespace-nowrap">
                        BDT {(price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>BDT {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>BDT {shippingCost.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Coupon {couponCode && `(${couponCode})`}</span>
                    <span>- BDT {discountAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-4">
                <span>Total</span>
                <span>BDT {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
