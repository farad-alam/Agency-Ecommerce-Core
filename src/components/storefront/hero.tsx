import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type HeroSlide = {
  eyebrow?: string;
  title: string;
  titleAccent?: string;
  description?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const slide = slides[0];

  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden"
      style={{
        background: "#0B0B0B",
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        paddingTop: "80px", /* account for fixed navbar + announcement bar */
      }}
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={slide.imageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          style={{ opacity: 0.45 }}
        />
        {/* gradient overlay — darkens bottom and left for text readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(11,11,11,0.92) 0%, rgba(11,11,11,0.6) 55%, rgba(11,11,11,0.1) 100%), linear-gradient(to top, rgba(11,11,11,0.8) 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 lg:px-8 py-20 lg:py-32">
        <div className="max-w-2xl">
          {/* Eyebrow label */}
          {slide.eyebrow && (
            <div
              className="sx-label mb-8"
              style={{ animationFillMode: "both" }}
            >
              {slide.eyebrow}
            </div>
          )}

          {/* Main headline */}
          <h1
            className="mb-6"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(44px, 7vw, 96px)",
              fontWeight: 900,
              lineHeight: 1.05,
              color: "#F5F2ED",
              letterSpacing: "-0.01em",
            }}
          >
            {slide.title}
            {slide.titleAccent && (
              <>
                <br />
                <em
                  style={{
                    fontStyle: "italic",
                    color: "#8B0D1A",
                  }}
                >
                  {slide.titleAccent}
                </em>
              </>
            )}
          </h1>

          {/* Red decorative line */}
          <div
            style={{
              width: "64px",
              height: "2px",
              background: "#8B0D1A",
              marginBottom: "24px",
            }}
          />

          {/* Description */}
          {slide.description && (
            <p
              className="mb-10"
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "16px",
                fontWeight: 400,
                lineHeight: 1.75,
                color: "#9A9A8E",
                maxWidth: "480px",
              }}
            >
              {slide.description}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            {slide.ctaLabel && (
              <Link href={slide.ctaHref} className="sx-btn-primary">
                {slide.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {slide.secondaryCtaLabel && (
              <Link
                href={slide.secondaryCtaHref ?? slide.ctaHref}
                className="sx-btn-ghost"
              >
                {slide.secondaryCtaLabel}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade into next section */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 z-10"
        style={{
          background:
            "linear-gradient(to bottom, transparent, #0B0B0B)",
        }}
      />
    </section>
  );
}