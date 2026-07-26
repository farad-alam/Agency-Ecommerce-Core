import { getStorefrontProductBySlug } from "@/storefront-sdk";
import { notFound } from "next/navigation";
import Image from "next/image";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";

// Client component wrapper for the interactive parts
import { ProductDetailClient } from "./product-client";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  try {
    const product = await getStorefrontProductBySlug(params.slug);
    return {
      title: product.title,
      description: product.description,
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function ProductDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  let product;
  
  try {
    product = await getStorefrontProductBySlug(params.slug);
  } catch (error) {
    notFound();
  }

  // Find default variant (in stock)
  const defaultVariant = product.variants.find(v => v.inventoryQty > 0) || product.variants[0];

  return (
    <div className="container mx-auto px-4 py-12">
      <ProductDetailClient product={product} initialVariant={defaultVariant} />
      
      {/* Product Description */}
      <div className="mt-16 max-w-3xl">
        <h2 className="text-2xl font-bold mb-6">Product Details</h2>
        <div className="prose prose-gray max-w-none">
          {/* Note: In production, sanitize HTML if it comes from rich text editor */}
          <div dangerouslySetInnerHTML={{ __html: product.description || "No description provided." }} />
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 max-w-3xl border-t pt-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        {product.reviews.length > 0 ? (
          <div className="space-y-6">
            {product.reviews.map(review => (
              <div key={review.id} className="border-b pb-6 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-2">{review.body}</p>
                <div className="text-sm text-gray-400">
                  By {review.name || "Verified Customer"} on {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        )}
      </div>
    </div>
  );
}
