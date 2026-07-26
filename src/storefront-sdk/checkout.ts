"use server";

import { db } from "@/lib/db";
import { processCheckout } from "@/core/checkout";
import { CheckoutInput } from "@/core/checkout/types";
import { getAuthIdentifiers } from "./cart";
import { sendEmail } from "@/lib/email";
import * as React from "react";
import OrderConfirmationEmail from "@/emails/order-confirmation";
import { headers } from "next/headers";
import { apiRateLimit } from "@/lib/rate-limit";
import { Errors } from "@/core/errors";

export async function submitCheckout(input: CheckoutInput) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "127.0.0.1";
  
  const { success } = await apiRateLimit.limit(ip);
  if (!success) {
    throw Errors.businessRule("Checkout rate limit exceeded. Please try again later.", "RATE_LIMITED");
  }

  const identity = await getAuthIdentifiers();
  
  // 1. Process Checkout
  const order = await processCheckout(identity, input);

  // 2. Trigger Confirmation Email (Fire and forget)
  sendEmail({
    to: order.guestEmail || "customer@example.com",
    subject: `Order Confirmation #${order.orderNumber}`,
    react: React.createElement(OrderConfirmationEmail, {
      orderNumber: order.orderNumber,
      customerName: ((order.shippingAddress as any)?.fullName) || "Valued Customer",
      total: `${Number(order.total)} ${order.currency}`,
    })
  }).catch(err => console.error("Failed to send order email:", err));

  // 3. (Future) Trigger Payment Gateway flow here if not stubbed

  return order;
}

export async function getAvailableShippingRates(country: string, subtotal: number) {
  // Query DB for zones that include the country
  const zones = await db.shippingZone.findMany({
    include: { rates: true }
  });
  
  // Find applicable rates (simplified matching)
  const applicableZone = zones.find(z => z.regions.includes(country)) || zones.find(z => z.regions.includes("Rest of World"));
  
  if (!applicableZone) return [];

  return applicableZone.rates.map(rate => {
    // Check if free shipping threshold is met
    if (rate.minSubtotalForFree && subtotal >= Number(rate.minSubtotalForFree)) {
      return { ...rate, price: 0 };
    }
    return { ...rate, price: Number(rate.price) };
  });
}
