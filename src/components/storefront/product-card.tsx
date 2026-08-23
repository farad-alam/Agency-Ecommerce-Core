import Image from "next/image";
import Link from "next/link";
import { Prisma } from "@prisma/client";

type ProductWithIncludes = Prisma.ProductGetPayload<{
  include: {
    media: true;
    variants: true;
  };
}>;

interface ProductCardProps {
  product: ProductWithIncludes;
  badge?: "new" | "bestseller";
}

export function ProductCard({ product, badge }: ProductCardProps) {
  const images = product.media.sort((a, b) => a.position - b.position);
  const thumbnail = images[0]?.url ?? null;
  const hoverImage = images[1]?.url ?? null;

  const lowestPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => Number(v.price)))
      : 0;

  const compareAtPrice =
    product.variants.length > 0 && product.variants[0].compareAtPrice
      ? Number(product.variants[0].compareAtPrice)
      : null;

  const hasDiscount = compareAtPrice && compareAtPrice > lowestPrice;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
      style={{ textDecoration: "none" }}
    >
      {/* Image container */}
      <div
        className="relative overflow-hidden w-full"
        style={{
          aspectRatio: "3/4",
          backgroundColor: "#0F0F0F",
        }}
      >
        {/* Badge */}
        {badge && (
          <span
            className="absolute top-4 left-4 z-20 rounded-full"
            style={{
              background: badge === "bestseller" ? "rgba(139, 92, 13, 0.2)" : "rgba(139, 13, 26, 0.2)",
              border: badge === "bestseller" ? "1px solid rgba(139, 92, 13, 0.4)" : "1px solid rgba(139, 13, 26, 0.4)",
              backdropFilter: "blur(4px)",
              color: badge === "bestseller" ? "#E5B05C" : "#FF4D5E",
              boxShadow: badge === "bestseller" ? "0 0 12px rgba(139, 92, 13, 0.3)" : "0 0 12px rgba(139, 13, 26, 0.3)",
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "5px 12px",
            }}
          >
            {badge === "bestseller" ? "Best Seller" : "New Drop"}
          </span>
        )}

        {/* Main image */}
        {thumbnail ? (
          <>
            <Image
              src={thumbnail}
              alt={product.title}
              fill
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              style={{ opacity: 1 }}
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 25vw"
            />
            {/* Hover image */}
            {hoverImage && (
              <Image
               src={hoverImage}
               alt={product.title}
               fill
               className="object-cover object-center absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
               sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: "#5A5A52", fontFamily: "'Inter', system-ui", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            No Image Available
          </div>
        )}

        {/* Premium Dark Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

        {/* View Details — Minimalist Center Fade */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-95 group-hover:scale-100 z-20 pointer-events-none">
          <span
            style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#F5F2ED",
              borderBottom: "1px solid #8B0D1A",
              paddingBottom: "4px",
            }}
          >
            Discover
          </span>
        </div>
      </div>

      {/* Card body — Editorial Layout */}
      <div className="pt-4 pb-2 flex items-start justify-between gap-4">
        <h3
          className="line-clamp-2"
          style={{
            fontFamily: "'Montserrat', Arial, sans-serif",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#F5F2ED",
            lineHeight: 1.4,
            flex: 1,
          }}
        >
          {product.title}
        </h3>
        
        <div className="flex flex-col items-end flex-shrink-0 text-right">
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              color: "#9A9A8E",
            }}
          >
            ৳{lowestPrice.toLocaleString()}
          </span>
          {hasDiscount && (
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "11px",
                color: "#5A5A52",
                textDecoration: "line-through",
                marginTop: "2px",
              }}
            >
              ৳{compareAtPrice!.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
