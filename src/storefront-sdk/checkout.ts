"use server";

import { processCheckout } from "@/core/checkout";
import { CheckoutInput } from "@/core/checkout/types";
import { getAuthIdentifiers } from "./cart";
import { sendEmail } from "@/lib/email";
import * as React from "react";
import OrderConfirmationEmail from "@/emails/order-confirmation";

export async function submitCheckout(input: CheckoutInput) {
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
