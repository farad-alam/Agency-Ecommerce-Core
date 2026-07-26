"use client";

import { useState } from "react";
import Image from "next/image";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";

export function ProductDetailClient({ product, initialVariant }: { product: any; initialVariant: any }) {
  const [selectedVariant, setSelectedVariant] = useState(initialVariant);
  const [mainImage, setMainImage] = useState(product.media[0]?.url || "/placeholder.png");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden">
          {mainImage !== "/placeholder.png" ? (
             <Image
              src={mainImage}
              alt={product.title}
              fill
              className="object-cover object-center"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
          )}
        </div>
        
        {/* Thumbnails */}
        {product.media.length > 1 && (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {product.media.map((media: any) => (
              <button 
                key={media.id}
                onClick={() => setMainImage(media.url)}
                className={`relative w-20 aspect-square rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  mainImage === media.url ? "border-black" : "border-transparent"
                }`}
              >
                <Image src={media.url} alt="Thumbnail" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col">
        {product.brand && (
          <span className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">
            {product.brand.name}
          </span>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          {product.title}
        </h1>
        
        <div className="flex items-center gap-4 mb-8">
          <span className="text-2xl font-semibold text-gray-900">
            BDT {Number(selectedVariant?.price || 0).toLocaleString()}
          </span>
          {selectedVariant?.compareAtPrice && Number(selectedVariant.compareAtPrice) > Number(selectedVariant.price) && (
            <span className="text-lg text-gray-500 line-through">
              BDT {Number(selectedVariant.compareAtPrice).toLocaleString()}
            </span>
          )}
        </div>

        {/* Variant Selection */}
        {product.variants.length > 0 && (
          <div className="mb-8 border-t border-b py-6">
            <VariantSelector 
              variants={product.variants} 
              onSelect={setSelectedVariant} 
            />
          </div>
        )}

        {/* Add to Cart Actions */}
        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-gray-600">Availability:</span>
            {selectedVariant?.inventoryQty > 0 ? (
              <span className="text-emerald-600 font-medium">In Stock ({selectedVariant.inventoryQty})</span>
            ) : (
              <span className="text-red-600 font-medium">Out of Stock</span>
            )}
          </div>
          
          <AddToCartButton variant={selectedVariant} />
        </div>
      </div>
    </div>
  );
}
