import Image from "next/image";
import Link from "next/link";
import { Prisma } from "@prisma/client";

type ProductWithIncludes = Prisma.ProductGetPayload<{
  include: {
    media: true;
    variants: true;
  }
}>;

export function ProductCard({ product }: { product: ProductWithIncludes }) {
  const thumbnail = product.media.length > 0 ? product.media[0].url : "/placeholder.png"; // Use placeholder if no image
  
  // Find lowest price
  const lowestPrice = product.variants.length > 0 
    ? Math.min(...product.variants.map(v => Number(v.price))) 
    : 0;

  const compareAtPrice = product.variants.length > 0 && product.variants[0].compareAtPrice
    ? Number(product.variants[0].compareAtPrice)
    : null;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden mb-4">
        {thumbnail !== "/placeholder.png" ? (
          <Image
            src={thumbnail}
            alt={product.title}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="font-medium text-gray-900 group-hover:underline underline-offset-4 line-clamp-1">
          {product.title}
        </h3>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">
            BDT {lowestPrice.toLocaleString()}
          </p>
          {compareAtPrice && compareAtPrice > lowestPrice && (
            <p className="text-xs text-gray-500 line-through">
              BDT {compareAtPrice.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
