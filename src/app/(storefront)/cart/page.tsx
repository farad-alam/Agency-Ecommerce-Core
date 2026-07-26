"use client";

import { useCart } from "@/components/storefront/cart-provider";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Minus, Plus, Loader2 } from "lucide-react";

export default function CartPage() {
  const { cart, isLoading, updateItem, removeItem, subtotal, total } = useCart();

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
        <h1 className="text-3xl font-bold tracking-tight mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/products" className="bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors inline-block">
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
        <div className="flex-1 space-y-6">
          <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b text-sm font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-6">Product</div>
            <div className="col-span-3 text-center">Quantity</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>
          
          <ul className="space-y-6">
            {cart.items.map((item: any) => (
              <li key={item.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-center py-4 border-b border-gray-100 last:border-0">
                
                {/* Product Info */}
                <div className="col-span-6 flex gap-4 w-full">
                  <div className="relative w-24 aspect-square bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {/* Assuming variant thumbnail logic is handled, or fallback to product image */}
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-100">Item</div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <Link href={`/products`} className="font-medium text-gray-900 hover:underline">
                      {item.productTitle}
                    </Link>
                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                      {Object.entries(item.variantOptions as Record<string, string> || {}).map(([k, v]) => (
                        <p key={k} className="capitalize">{k}: {v}</p>
                      ))}
                    </div>
                    <p className="text-sm font-medium mt-2 md:hidden">
                      BDT {Number(item.price).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Quantity */}
                <div className="col-span-3 flex justify-between md:justify-center items-center w-full mt-4 md:mt-0">
                  <span className="md:hidden text-sm text-gray-500">Quantity:</span>
                  <div className="flex items-center border rounded-md">
                    <button 
                      onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                      className="p-2 hover:bg-gray-50 text-gray-500"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-50 text-gray-500"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="col-span-2 hidden md:block text-right font-medium text-gray-900">
                  BDT {(Number(item.price) * item.quantity).toLocaleString()}
                </div>

                {/* Remove */}
                <div className="col-span-1 flex justify-end w-full md:w-auto mt-2 md:mt-0">
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

              </li>
            ))}
          </ul>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96">
          <div className="bg-gray-50 rounded-lg p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 pb-6 border-b border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>BDT {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            
            <div className="flex justify-between font-bold text-lg py-6">
              <span>Total</span>
              <span>BDT {total.toLocaleString()}</span>
            </div>
            
            <Link 
              href="/checkout"
              className="w-full flex justify-center py-4 px-4 bg-black text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
