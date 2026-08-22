"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import {
  getActiveCart,
  addProductToCart,
  updateProductInCart,
  removeProductFromCart,
  applyStorefrontCoupon,
  removeStorefrontCoupon,
} from "@/storefront-sdk/cart";
import { CartItemInput } from "@/core/cart/types";
import { toast } from "sonner";
import { CartFull } from "@/core/cart";

const SHIPPING_COST = 150; // flat rate in BDT

interface CartContextType {
  cart: CartFull | null;
  isLoading: boolean;
  isPending: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refreshCart: () => Promise<void>;
  addItem: (input: CartItemInput) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  couponCode: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const refreshCart = async () => {
    try {
      const activeCart = await getActiveCart();
      setCart(activeCart);
    } catch (error) {
      console.error("Failed to load cart", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addItem = async (input: CartItemInput) => {
    startTransition(async () => {
      try {
        const updatedCart = await addProductToCart(input);
        setCart(updatedCart);
        setIsDrawerOpen(true);
      } catch (error: any) {
        toast.error(error.message || "Failed to add item to cart");
      }
    });
  };

  const updateItem = async (itemId: string, quantity: number) => {
    startTransition(async () => {
      try {
        const updatedCart = await updateProductInCart(itemId, { quantity });
        setCart(updatedCart);
      } catch (error: any) {
        toast.error(error.message || "Failed to update quantity");
        refreshCart();
      }
    });
  };

  const removeItem = async (itemId: string) => {
    startTransition(async () => {
      try {
        const updatedCart = await removeProductFromCart(itemId);
        setCart(updatedCart);
        toast.success("Item removed");
      } catch (error: any) {
        toast.error(error.message || "Failed to remove item");
      }
    });
  };

  const applyCoupon = async (code: string) => {
    startTransition(async () => {
      try {
        const result = await applyStorefrontCoupon(code);
        if ('error' in result) {
          toast.error(result.error);
          return;
        }
        setDiscountAmount(result.discountAmount);
        await refreshCart();
        toast.success(`Coupon applied! You save BDT ${result.discountAmount.toLocaleString()}`);
      } catch (error: any) {
        toast.error(error.message || "Invalid coupon code");
      }
    });
  };

  const removeCoupon = async () => {
    startTransition(async () => {
      try {
        await removeStorefrontCoupon();
        setDiscountAmount(0);
        await refreshCart();
        toast.success("Coupon removed");
      } catch (error: any) {
        toast.error(error.message || "Failed to remove coupon");
      }
    });
  };

  const itemCount = cart?.items.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
  const subtotal = cart?.items.reduce(
    (acc: number, item: any) => acc + (Number(item.variant?.price ?? 0) * item.quantity),
    0
  ) || 0;
  const shippingCost = itemCount > 0 ? SHIPPING_COST : 0;
  const couponCode = cart?.couponCode ?? null;
  const total = Math.max(0, subtotal + shippingCost - discountAmount);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isPending,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        refreshCart,
        addItem,
        updateItem,
        removeItem,
        applyCoupon,
        removeCoupon,
        itemCount,
        subtotal,
        discountAmount,
        shippingCost,
        total,
        couponCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
