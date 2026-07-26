import { db } from "@/lib/db";
import { Errors } from "@/core/errors";
import { CartItemInput, UpdateCartItemInput } from "./types";
import { Prisma } from "@prisma/client";

export const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: {
              media: {
                where: { position: 0 },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: {
      addedAt: "asc",
    } as const,
  },
} satisfies Prisma.CartInclude;

export type CartFull = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

/**
 * Resolves a cart either by userId (if logged in) or sessionId.
 * Creates one if it doesn't exist.
 */
export async function getOrCreateCart(identity: {
  userId?: string;
  sessionId?: string;
}): Promise<CartFull> {
  if (!identity.userId && !identity.sessionId) {
    throw Errors.validation({ identity: ["Either userId or sessionId must be provided to resolve cart"] });
  }

  const whereClause = identity.userId
    ? { userId: identity.userId }
    : { sessionId: identity.sessionId! };

  let cart = await db.cart.findUnique({
    where: whereClause,
    include: cartInclude,
  });

  if (!cart) {
    // If identifying by userId, check if a sessionId cart exists to merge (optional feature for later)
    // Create new cart
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration for carts

    cart = await db.cart.create({
      data: {
        ...whereClause,
        expiresAt,
      },
      include: cartInclude,
    });
  }

  return cart;
}

export async function addToCart(
  cartId: string,
  input: CartItemInput
): Promise<CartFull> {
  // Verify variant exists
  const variant = await db.productVariant.findUnique({
    where: { id: input.variantId },
    include: { product: true },
  });

  if (!variant) {
    throw Errors.notFound("Product variant");
  }

  if (variant.product.status !== "ACTIVE") {
    throw Errors.validation({ product: ["Product is not available for purchase"] });
  }

  // Check if item already in cart
  const existingItem = await db.cartItem.findUnique({
    where: {
      cartId_variantId: {
        cartId,
        variantId: input.variantId,
      },
    },
  });

  if (existingItem) {
    await db.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + input.quantity },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId,
        variantId: input.variantId,
        quantity: input.quantity,
      },
    });
  }

  // Fetch and return updated cart
  return db.cart.findUniqueOrThrow({
    where: { id: cartId },
    include: cartInclude,
  });
}

export async function updateCartItem(
  cartId: string,
  itemId: string,
  input: UpdateCartItemInput
): Promise<CartFull> {
  const item = await db.cartItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.cartId !== cartId) {
    throw Errors.notFound("Cart item");
  }

  if (input.quantity === 0) {
    await db.cartItem.delete({
      where: { id: itemId },
    });
  } else {
    await db.cartItem.update({
      where: { id: itemId },
      data: { quantity: input.quantity },
    });
  }

  return db.cart.findUniqueOrThrow({
    where: { id: cartId },
    include: cartInclude,
  });
}

export async function removeCartItem(
  cartId: string,
  itemId: string
): Promise<CartFull> {
  const item = await db.cartItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.cartId !== cartId) {
    throw Errors.notFound("Cart item");
  }

  await db.cartItem.delete({
    where: { id: itemId },
  });

  return db.cart.findUniqueOrThrow({
    where: { id: cartId },
    include: cartInclude,
  });
}
