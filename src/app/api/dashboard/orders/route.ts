import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDashboardAccess } from "@/core/auth/helpers";

export async function POST(request: Request) {
  try {
    const user = await requireDashboardAccess();
    const body = await request.json();

    const {
      guestEmail,
      items,
      shippingAddress,
      shippingTotal,
      discountTotal,
      paymentProvider,
      paymentStatus,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "Order must have at least one item" }, { status: 400 });
    }

    const subtotal = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const total = subtotal + Number(shippingTotal) - Number(discountTotal);

    // Generate random order number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomNum}`;

    const order = await db.$transaction(async (tx) => {
      // Check inventory
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant || variant.inventoryQty < item.quantity) {
          throw new Error(`Not enough inventory for item ${item.title}`);
        }
        
        // Decrement inventory
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { inventoryQty: variant.inventoryQty - item.quantity }
        });
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          guestEmail,
          currency: "BDT",
          status: "PENDING",
          paymentStatus,
          paymentProvider,
          shippingAddress: shippingAddress as any,
          subtotal,
          shippingTotal: Number(shippingTotal),
          discountTotal: Number(discountTotal),
          taxTotal: 0,
          total,
          items: {
            create: items.map((item: any) => ({
              variantId: item.variantId,
              productTitle: item.title,
              sku: "MANUAL", // We'd ideally pass the SKU from the client
              price: item.price,
              quantity: item.quantity,
              currency: "BDT"
            }))
          },
          statusHistory: {
            create: {
              status: "PENDING",
              note: `Manual order created by ${user.name}`
            }
          }
        }
      });

      return newOrder;
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ message: error.message || "Failed to create order" }, { status: 500 });
  }
}
