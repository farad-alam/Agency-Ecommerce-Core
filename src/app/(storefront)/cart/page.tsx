"use client";

import { useCart } from "@/components/storefront/cart-provider";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Minus, Plus, Loader2, Tag, X, ShoppingBag } from "lucide-react";
import { useState } from "react";

export default function CartPage() {
  const {
    cart,
    isLoading,
    isPending,
    updateItem,
    removeItem,
    applyCoupon,
    removeCoupon,
    subtotal,
    discountAmount,
    shippingCost,
    total,
    couponCode,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    await applyCoupon(couponInput.trim().toUpperCase());
    setIsApplyingCoupon(false);
    setCouponInput("");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-lg">
        <ShoppingBag className="w-20 h-20 mx-auto mb-6 text-gray-200" />
        <h1 className="text-3xl font-bold tracking-tight mb-4">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-8">Looks like you haven&apos;t added anything yet.</p>
        <Link
          href="/products"
          className="inline-block bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Your Cart</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div className="col-span-6">Product</div>
            <div className="col-span-3 text-center">Quantity</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1" />
          </div>

          <ul className="divide-y divide-gray-100">
            {cart.items.map((item: any) => {
              const imageUrl = item.variant?.product?.media?.[0]?.url;
              const price = Number(item.variant?.price ?? 0);
              const variantOptions = item.variant?.options as Record<string, string> | null;

              return (
                <li
                  key={item.id}
                  className="py-6 flex flex-col md:grid md:grid-cols-12 gap-4 items-center"
                >
                  {/* Product */}
                  <div className="col-span-6 flex gap-4 w-full">
                    <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={item.productTitle} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-1">
                      <p className="font-semibold text-gray-900">{item.productTitle}</p>
                      {variantOptions && Object.keys(variantOptions).length > 0 && (
                        <p className="text-sm text-gray-500 capitalize">
                          {Object.entries(variantOptions)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="text-sm font-medium text-gray-700 md:hidden">
                        BDT {price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-3 flex justify-between md:justify-center items-center w-full">
                    <span className="md:hidden text-sm text-gray-500">Qty:</span>
                    <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                        disabled={isPending}
                        className="px-3 py-2 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={isPending}
                        className="px-3 py-2 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="col-span-2 hidden md:block text-right font-semibold text-gray-900">
                    BDT {(price * item.quantity).toLocaleString()}
                  </div>

                  {/* Remove */}
                  <div className="col-span-1 flex justify-end w-full md:w-auto">
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={isPending}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:sticky lg:top-24 space-y-6">
            <h2 className="text-lg font-bold">Order Summary</h2>

            {/* Coupon */}
            <div>
              {couponCode ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm font-medium">{couponCode} applied</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    disabled={isPending}
                    className="text-green-600 hover:text-red-500 transition-colors"
                    aria-label="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Coupon code"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponInput.trim()}
                    className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
              )}
            </div>

            {/* Pricing breakdown */}
            <div className="space-y-3 text-sm border-t pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>BDT {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping (Bangladesh)</span>
                <span>BDT {shippingCost.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount</span>
                  <span>- BDT {discountAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-4">
              <span>Total</span>
              <span>BDT {total.toLocaleString()}</span>
            </div>

            <Link
              href="/checkout"
              className="w-full flex items-center justify-center py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Proceed to Checkout
            </Link>

            <Link href="/products" className="block text-center text-sm text-gray-500 hover:text-black transition-colors">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
