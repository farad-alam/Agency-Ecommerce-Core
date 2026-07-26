"use client";

import { useCart } from "./cart-provider";
import { Prisma } from "@prisma/client";
import { Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Variant = Prisma.ProductVariantGetPayload<{}>;

export function AddToCartButton({ 
  variant, 
  quantity = 1,
  className
}: { 
  variant: Variant;
  quantity?: number;
  className?: string;
}) {
  const { addItem, isPending } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const isOutOfStock = variant.inventoryQty <= 0;

  const handleAdd = async () => {
    if (isOutOfStock) return;
    setIsAdding(true);
    await addItem({
      variantId: variant.id,
      quantity,
    });
    setIsAdding(false);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={isOutOfStock || isPending || isAdding}
      className={cn(
        "w-full flex items-center justify-center gap-2 py-3 px-6 rounded-md font-medium text-white transition-all",
        isOutOfStock 
          ? "bg-gray-300 cursor-not-allowed" 
          : "bg-black hover:bg-gray-800 active:scale-[0.98]",
        className
      )}
    >
      {(isPending && isAdding) ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <ShoppingCart className="w-5 h-5" />
      )}
      {isOutOfStock ? "Out of Stock" : "Add to Cart"}
    </button>
  );
}
