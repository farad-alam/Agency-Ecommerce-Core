import { db } from "@/lib/db";
import { Errors } from "@/core/errors";
import { CheckoutInput } from "./types";
import { storeConfig } from "@/config/store.config";
import { validateCoupon, incrementCouponUsage } from "@/core/coupons";
import { getOrCreateCart } from "@/core/cart";
import { Prisma } from "@prisma/client";
import * as React from "react";
import { sendEmail } from "@/lib/email";
import { OrderConfirmationEmail } from "@/components/emails/order-confirmation";

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

  // Check MFS transaction ID uniqueness to prevent reuse
  if (input.paymentMethod === "MFS" && input.mfsPayment) {
    const existingPayment = await db.mfsPayment.findFirst({
      where: {
        provider: input.mfsPayment.provider,
        transactionId: input.mfsPayment.transactionId,
      },
    });
    if (existingPayment) {
      throw Errors.businessRule(
        `Transaction ID ${input.mfsPayment.transactionId} has already been used for a previous order.`,
        "DUPLICATE_TRANSACTION_ID"
      );
    }
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

  // Get live store settings for shipping and tax calculations
  const { getStoreSettings } = await import("@/core/settings");
  const settings = await getStoreSettings();

  const shippingTotal = settings.shippingFlatRate;
  let taxTotal = 0;
  
  if (settings.taxMode === "FLAT_RATE" && settings.taxRate > 0) {
    taxTotal = (subtotal * settings.taxRate) / 100;
  }

  // Apply coupon if one was set on the cart
  let discountTotal = 0;
  let couponCode: string | null = cart.couponCode ?? null;
  let isFreeShipping = false;

  if (couponCode) {
    const validation = await validateCoupon(couponCode, subtotal);
    discountTotal = validation.discountAmount;
    if (validation.coupon.type === "FREE_SHIPPING") {
      isFreeShipping = true;
    }
  }

  const finalShipping = isFreeShipping ? 0 : shippingTotal;
  const total = subtotal + finalShipping + taxTotal - discountTotal;

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
        shippingTotal: finalShipping,
        taxTotal,
        discountTotal,
        total,
        currency: storeConfig.currency,
        couponCode,
        paymentProvider: input.paymentMethod.toLowerCase(),
        shippingAddress: input.shippingAddress as Prisma.InputJsonValue,
        billingAddress: billingAddress as Prisma.InputJsonValue,
        notes: input.notes,
        items: {
          createMany: {
            data: orderItemsData,
          },
        },
        ...(input.paymentMethod === "MFS" && input.mfsPayment ? {
          mfsPayment: {
            create: {
              provider: input.mfsPayment.provider,
              senderNumber: input.mfsPayment.senderNumber,
              transactionId: input.mfsPayment.transactionId,
            }
          }
        } : {})
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
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    // Clear coupon from cart
    await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null } });

    return newOrder;
  });

  // Increment coupon usage AFTER the transaction succeeds
  if (couponCode) {
    await incrementCouponUsage(couponCode);
  }

  // Send Order Confirmation Email
  const customerEmail = identity.userId ? (await db.user.findUnique({ where: { id: identity.userId } }))?.email : input.guestEmail;
  if (customerEmail) {
    const address = input.shippingAddress as Record<string, string>;
    const addressString = `${address.line1}\n${address.city}, ${address.region} ${address.postalCode}\n${address.country}`;
    
    // We intentionally don't await the email to avoid blocking the checkout response
    sendEmail({
      to: customerEmail,
      subject: `Order Confirmation - ${order.orderNumber}`,
      react: React.createElement(OrderConfirmationEmail, {
        orderNumber: order.orderNumber,
        customerName: address.firstName || "Customer",
        total: `${Number(order.total).toLocaleString()} BDT`,
        items: orderItemsData.map(item => ({
          title: item.productTitle as string,
          quantity: item.quantity,
          price: `${Number(item.price).toLocaleString()} BDT`
        })),
        shippingAddress: addressString
      })
    });
  }

  return order;
}
