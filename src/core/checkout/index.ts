import { db } from "@/lib/db";
import { Errors } from "@/core/errors";
import { CheckoutInput } from "./types";
import { getOrCreateCart } from "@/core/cart";
import { Prisma } from "@prisma/client";

function generateOrderNumber(): string {
  // Simple order number generator e.g. ORD-20260726-XXXX
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${date}-${random}`;
}

export async function processCheckout(
  identity: { userId?: string; sessionId?: string },
  input: CheckoutInput
) {
  // 1. Get Cart
  const cart = await getOrCreateCart(identity);

  if (cart.items.length === 0) {
    throw Errors.businessRule("Cart is empty", "CART_EMPTY");
  }

  // Check guest email vs userId
  if (!identity.userId && !input.guestEmail) {
    throw Errors.validation({ guestEmail: ["Guest email is required for anonymous checkout"] });
  }

  // 2. Validate inventory & calculate totals
  let subtotal = 0;
  
  // We should refresh the variants from DB to ensure prices and inventory are accurate
  const itemVariantIds = cart.items.map((i) => i.variantId);
  const variants = await db.productVariant.findMany({
    where: { id: { in: itemVariantIds } },
    include: { product: true },
  });

  const variantMap = new Map(variants.map((v) => [v.id, v]));
  const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

  for (const item of cart.items) {
    const variant = variantMap.get(item.variantId);
    if (!variant || variant.product.status !== "ACTIVE") {
      throw Errors.validation({ product: [`Item ${item.variant.product.title} is no longer available`] });
    }
    if (variant.inventoryQty < item.quantity) {
      throw Errors.inventoryInsufficient(variant.id, variant.inventoryQty);
    }

    const price = Number(variant.price);
    subtotal += price * item.quantity;

    orderItemsData.push({
      variantId: variant.id,
      productTitle: variant.product.title,
      variantOptions: variant.options as Prisma.InputJsonValue,
      sku: variant.sku,
      price: price,
      quantity: item.quantity,
    });
  }

  // In a real app, calculate shipping and taxes based on address. 
  // For Sprint 2 stub, we assume 0 for now.
  const shippingTotal = 0;
  const taxTotal = 0;
  const discountTotal = 0; // Coupons later
  const total = subtotal + shippingTotal + taxTotal - discountTotal;

  // 3. Create Order & decrement inventory atomically
  const order = await db.$transaction(async (tx) => {
    const billingAddress = input.billingAddress || input.shippingAddress;

    // Create Order
    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: identity.userId,
        guestEmail: identity.userId ? null : input.guestEmail,
        status: "PENDING",
        subtotal,
        shippingTotal,
        taxTotal,
        discountTotal,
        total,
        currency: "BDT", // Store default from store.config.ts in future
        shippingAddress: input.shippingAddress as Prisma.InputJsonValue,
        billingAddress: billingAddress as Prisma.InputJsonValue,
        notes: input.notes,
        items: {
          createMany: {
            data: orderItemsData,
          },
        },
      },
      include: {
        items: true,
      },
    });

    // Decrement inventory
    for (const item of orderItemsData) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          inventoryQty: { decrement: item.quantity },
        },
      });
    }

    // Clear cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return newOrder;
  });

  return order;
}
