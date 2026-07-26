"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { getActiveCart, addProductToCart, updateProductInCart, removeProductFromCart } from "@/storefront-sdk/cart";
import { Prisma } from "@prisma/client";
import { CartItemInput } from "@/core/cart/types";
import { toast } from "sonner";
import { CartFull } from "@/core/cart";

interface CartContextType {
  cart: CartFull | null;
  isLoading: boolean;
  isPending: boolean;
  refreshCart: () => Promise<void>;
  addItem: (input: CartItemInput) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  itemCount: number;
  subtotal: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

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
        toast.success("Added to cart");
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
        // Revert optimistically if needed, here we just refresh
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

  const itemCount = cart?.items.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
  const subtotal = cart?.items.reduce((acc: number, item: any) => acc + (Number(item.variant?.price || item.price || 0) * item.quantity), 0) || 0;
  const total = subtotal; // Add tax/shipping later

  return (
    <CartContext.Provider value={{ cart, isLoading, isPending, refreshCart, addItem, updateItem, removeItem, itemCount, subtotal, total }}>
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
