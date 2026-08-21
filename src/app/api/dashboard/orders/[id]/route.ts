import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDashboardAccess } from "@/core/auth/helpers";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireDashboardAccess();
    const params = await props.params;

    const order = await db.order.findUnique({ where: { id: params.id } });
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Delete the order (cascade deletion should handle related records if configured in schema,
    // otherwise we use transaction to manually delete related records)
    await db.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: params.id } });
      await tx.orderStatusEvent.deleteMany({ where: { orderId: params.id } });
      await tx.mfsPayment.deleteMany({ where: { orderId: params.id } });
      
      await tx.order.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Order delete error:", error);
    return NextResponse.json({ message: error.message || "Failed to delete order" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDashboardAccess();
    const params = await props.params;
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

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { items: true }
    });
    
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const subtotal = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const total = subtotal + Number(shippingTotal) - Number(discountTotal);

    const updatedOrder = await db.$transaction(async (tx) => {
      // For simplicity in this edit implementation, we'll delete all old items and create new ones.
      // (In a production system, you'd calculate diffs to properly restore/deduct inventory)
      
      // Restore inventory from old items
      for (const oldItem of order.items) {
        if (oldItem.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: oldItem.variantId } });
          if (variant) {
            await tx.productVariant.update({
              where: { id: oldItem.variantId },
              data: { inventoryQty: variant.inventoryQty + oldItem.quantity }
            });
          }
        }
      }

      // Deduct inventory for new items
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant || variant.inventoryQty < item.quantity) {
          throw new Error(`Not enough inventory for item ${item.title}`);
        }
        
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { inventoryQty: variant.inventoryQty - item.quantity }
        });
      }

      // Delete old items
      await tx.orderItem.deleteMany({ where: { orderId: params.id } });

      // Update order and create new items
      return await tx.order.update({
        where: { id: params.id },
        data: {
          guestEmail,
          paymentStatus,
          paymentProvider,
          shippingAddress: shippingAddress as any,
          subtotal,
          shippingTotal: Number(shippingTotal),
          discountTotal: Number(discountTotal),
          total,
          items: {
            create: items.map((item: any) => ({
              variantId: item.variantId,
              productTitle: item.title,
              sku: "MANUAL", // Ideally pass from client
              price: item.price,
              quantity: item.quantity,
              currency: "BDT"
            }))
          },
          statusHistory: {
            create: {
              status: order.status,
              note: `Order manually updated by ${user.name}`
            }
          }
        }
      });
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("Order edit error:", error);
    return NextResponse.json({ message: error.message || "Failed to update order" }, { status: 500 });
  }
}
