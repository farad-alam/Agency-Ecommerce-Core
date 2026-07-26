"use server";

import { getOrCreateCart, addToCart, updateCartItem, removeCartItem } from "@/core/cart";
import { CartItemInput, UpdateCartItemInput } from "@/core/cart/types";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "storefront_session_id";

export async function getAuthIdentifiers() {
  const session = await auth();
  const userId = session?.user?.id;
  
  let sessionId = undefined;
  if (!userId) {
    const cookieStore = await cookies();
    sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionId) {
      sessionId = crypto.randomBytes(16).toString("hex");
      // Set cookie for 30 days
      cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, 
      });
    }
  }

  return { userId, sessionId };
}

export async function getActiveCart() {
  const { userId, sessionId } = await getAuthIdentifiers();
  return await getOrCreateCart({ userId, sessionId });
}

export async function addProductToCart(input: CartItemInput) {
  const { userId, sessionId } = await getAuthIdentifiers();
  const cart = await getOrCreateCart({ userId, sessionId });
  
  return await addToCart(cart.id, input);
}

export async function updateProductInCart(itemId: string, input: UpdateCartItemInput) {
  const { userId, sessionId } = await getAuthIdentifiers();
  const cart = await getOrCreateCart({ userId, sessionId });
  
  return await updateCartItem(cart.id, itemId, input);
}

export async function removeProductFromCart(itemId: string) {
  const { userId, sessionId } = await getAuthIdentifiers();
  const cart = await getOrCreateCart({ userId, sessionId });
  
  return await removeCartItem(cart.id, itemId);
}
