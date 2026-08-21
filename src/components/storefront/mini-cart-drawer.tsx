"use client";

import { useCart } from "./cart-provider";
import Link from "next/link";
import Image from "next/image";
import { X, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

export function MiniCartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, updateItem, removeItem, subtotal, discountAmount, shippingCost, total, couponCode, isPending } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        closeDrawer();
      }
    };
    if (isDrawerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen, closeDrawer]);

  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [closeDrawer]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-lg font-bold tracking-tight">Your Cart</h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-200" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <button
                onClick={closeDrawer}
                className="text-sm text-black underline underline-offset-2 hover:opacity-70"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-5">
              {cart.items.map((item: any) => {
                const imageUrl = item.variant?.product?.media?.[0]?.url;
                const price = Number(item.variant?.price ?? 0);
                const variantOptions = item.variant?.options as Record<string, string> | null;

                return (
                  <li key={item.id} className="flex gap-4">
                    {/* Image */}
                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={item.productTitle} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No img</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 line-clamp-2">{item.productTitle}</p>
                      {variantOptions && Object.keys(variantOptions).length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">
                          {Object.entries(variantOptions).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </p>
                      )}
                      <p className="text-sm font-semibold mt-1">BDT {price.toLocaleString()}</p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                          disabled={isPending}
                          className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          disabled={isPending}
                          className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={isPending}
                          className="ml-auto text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t px-6 py-5 space-y-4 bg-gray-50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>BDT {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping (Bangladesh)</span>
                <span>BDT {shippingCost.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && couponCode && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coupon ({couponCode})</span>
                  <span>- BDT {discountAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-3">
              <span>Total</span>
              <span>BDT {total.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="flex items-center justify-center py-3 px-4 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
