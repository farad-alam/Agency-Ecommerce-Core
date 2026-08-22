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
        className="relative overflow-hidden"
        style={{
          aspectRatio: "3/4",
          background: "#141414",
          border: "1px solid #2A2A2A",
          transition: "border-color 0.3s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#8B0D1A";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#2A2A2A";
        }}
      >
        {/* Badge */}
        {badge && (
          <span
            className="absolute top-3 left-3 z-10"
            style={{
              background: badge === "bestseller" ? "#8B5C0D" : "#8B0D1A",
              color: "#F5F2ED",
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "4px 10px",
            }}
          >
            {badge === "bestseller" ? "⭐ Best Seller" : "New"}
          </span>
        )}

        {/* Main image */}
        {thumbnail ? (
          <>
            <Image
              src={thumbnail}
              alt={product.title}
              fill
              className="object-cover object-center transition-all duration-500"
              style={{
                opacity: hoverImage ? 1 : 1,
              }}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {/* Hover image */}
            {hoverImage && (
              <Image
                src={hoverImage}
                alt={product.title}
                fill
                className="object-cover object-center absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: "#9A9A8E", fontFamily: "'Inter', system-ui", fontSize: "12px" }}>
            No Image
          </div>
        )}

        {/* View Details overlay — slides up on hover */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-center py-3 transition-all duration-300 translate-y-full group-hover:translate-y-0"
          style={{ background: "#8B0D1A" }}
        >
          <span
            style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#F5F2ED",
            }}
          >
            View Details →
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="pt-3 pb-1" style={{ background: "#0B0B0B" }}>
        <h3
          className="line-clamp-1"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "#F5F2ED",
            marginBottom: "4px",
          }}
        >
          {product.title}
        </h3>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "15px",
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
                fontSize: "12px",
                color: "#9A9A8E",
                textDecoration: "line-through",
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
