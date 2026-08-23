"use client";

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
      className="group block transition-all duration-300 hover:-translate-y-1"
      style={{
        textDecoration: "none",
        background: "#141414",
        border: "1px solid #242424",
        borderRadius: "8px",
        padding: "10px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justify: "space-between",
      }}
    >
      <div>
        {/* Image container */}
        <div
          className="relative overflow-hidden w-full rounded-md"
          style={{
            aspectRatio: "3/4",
            backgroundColor: "#0F0F0F",
          }}
        >
          {/* Badge */}
          {badge && (
            <span
              className="absolute top-3 left-3 z-20 rounded-full"
              style={{
                background: badge === "bestseller" ? "rgba(139, 92, 13, 0.25)" : "rgba(139, 13, 26, 0.25)",
                border: badge === "bestseller" ? "1px solid rgba(139, 92, 13, 0.5)" : "1px solid rgba(139, 13, 26, 0.5)",
                backdropFilter: "blur(6px)",
                color: badge === "bestseller" ? "#E5B05C" : "#FF4D5E",
                boxShadow: badge === "bestseller" ? "0 0 10px rgba(139, 92, 13, 0.3)" : "0 0 10px rgba(139, 13, 26, 0.3)",
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "4px 10px",
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

          {/* Dark Overlay on Hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

          {/* View Details — Minimalist Center Fade */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-95 group-hover:scale-100 z-20 pointer-events-none">
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

        {/* Card body — Rich Dense Layout */}
        <div className="pt-3 pb-2 flex flex-col gap-1.5">
          {/* Top Row: Stars and Status Marker */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="flex" style={{ color: "#8B0D1A" }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span style={{ fontSize: "10px", color: "#6A6A60", fontFamily: "'Inter', sans-serif" }}>(42)</span>
            </div>
            
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#E5B05C",
              }}
            >
              ⚡ EXPRESS
            </span>
          </div>

          {/* Title */}
          <h3
            className="line-clamp-1"
            style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: "#F5F2ED",
              lineHeight: 1.2,
            }}
          >
            {product.title}
          </h3>
          
          {/* Bottom Row: Swatches and Price */}
          <div className="flex items-end justify-between mt-0.5">
            {/* Mock Swatches */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-[#3A3A3A]" style={{ backgroundColor: "#1A1A1A" }}></span>
              <span className="w-2.5 h-2.5 rounded-full border border-[#3A3A3A]" style={{ backgroundColor: "#8C8C8C" }}></span>
              <span className="w-2.5 h-2.5 rounded-full border border-[#3A3A3A]" style={{ backgroundColor: "#D4D4CE" }}></span>
            </div>

            <div className="flex flex-col items-end text-right">
              <span
                style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#F5F2ED",
                }}
              >
                ৳{lowestPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: "10px",
                    color: "#6A6A60",
                    textDecoration: "line-through",
                    marginTop: "1px",
                  }}
                >
                  ৳{compareAtPrice!.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Red Add to Bag Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          // Add to bag action placeholder
        }}
        className="mt-2 w-full py-2.5 rounded-md flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#A31020] active:scale-[0.98]"
        style={{
          background: "#8B0D1A",
          color: "#F5F2ED",
          fontFamily: "'Montserrat', Arial, sans-serif",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          border: "none",
          cursor: "pointer",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        Add to Bag
      </button>
    </Link>
  );
}
