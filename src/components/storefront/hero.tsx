"use client";

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

/* Rotating SVG circular text badge */
function CircularBadge() {
  const text = "NEW SEASON · SS 2026 · MEN'S WEAR · ";
  const chars = text.split("");
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const charCount = chars.length;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 120, height: 120 }}
      aria-hidden="true"
    >
      {/* Outer rotating ring */}
      <svg
        viewBox="0 0 120 120"
        width={120}
        height={120}
        className="sx-spin absolute inset-0"
      >
        <defs>
          <path
            id="circle-path"
            d="M 60,60 m -46,0 a 46,46 0 1,1 92,0 a 46,46 0 1,1 -92,0"
          />
        </defs>
        <text
          style={{
            fontFamily: "'Montserrat', Arial, sans-serif",
            fontSize: "8.5px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            fill: "#F5F2ED",
            textTransform: "uppercase",
          }}
        >
          <textPath href="#circle-path">{text}</textPath>
        </text>
      </svg>
      {/* Center arrow */}
      <div
        className="relative z-10 flex items-center justify-center"
        style={{
          width: 40,
          height: 40,
          background: "#8B0D1A",
        }}
      >
        <ArrowRight className="h-4 w-4 text-[#F5F2ED]" />
      </div>
    </div>
  );
}

/* Bottom scrolling ticker */
function Ticker() {
  const items = [
    "NEW ARRIVALS",
    "MEN'S WEAR",
    "PREMIUM QUALITY",
    "FREE DELIVERY",
    "CHAPAINAWABGANJ",
    "GEN Z FASHION",
    "STREET STYLE",
    "SS 2026",
  ];
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div
      className="sx-marquee-track"
      style={{
        background: "#8B0D1A",
        height: "40px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="sx-marquee" aria-hidden="true">
        {repeated.map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#F5F2ED",
              whiteSpace: "nowrap",
              paddingRight: "48px",
            }}
          >
            {item}
            <span style={{ marginLeft: "48px", opacity: 0.5 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const slide = slides[0];

  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden flex flex-col"
      style={{ background: "#0B0B0B", minHeight: "100svh" }}
    >
      {/* ── MAIN HERO BODY ───────────────────────────── */}
      <div className="flex flex-col lg:flex-row flex-1" style={{ paddingTop: "56px" }}>

        {/* ─── LEFT PANEL: Typography ─────────────────── */}
        <div
          className="relative flex flex-col justify-center px-6 lg:px-16 py-16 lg:py-24 z-10"
          style={{
            background: "#0B0B0B",
            flex: "0 0 50%",
            minHeight: "calc(100svh - 56px - 40px)", /* subtract navbar + ticker */
          }}
        >
          {/* Vertical brand rail */}
          <div
            className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 items-center gap-2"
            style={{ transform: "translateY(-50%) rotate(-90deg)", transformOrigin: "center" }}
            aria-hidden="true"
          >
            <span
              style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#2A2A2A",
              }}
            >
              SALARX · 2026 · EST. CHAPAINAWABGANJ
            </span>
          </div>

          {/* Content */}
          <div className="max-w-xl pl-4 lg:pl-8">

            {/* Eyebrow label */}
            <div className="sx-label mb-8 sx-fade-in" aria-hidden="false">
              {slide.eyebrow ?? "Men's Fashion · Gen Z Edition"}
            </div>

            {/* ── STACKED OVERSIZED HEADLINE ── */}
            <div className="overflow-hidden mb-2">
              <h1
                className="sx-clip-reveal sx-clip-delay-1 leading-none block"
                style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "clamp(64px, 9.5vw, 152px)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#F5F2ED",
                  lineHeight: 0.9,
                  marginBottom: "0.05em",
                }}
              >
                YOUR
              </h1>
            </div>
            <div className="overflow-hidden mb-2">
              <span
                className="sx-clip-reveal sx-clip-delay-2 block leading-none"
                aria-hidden="true"
                style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "clamp(64px, 9.5vw, 152px)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.9,
                  color: "transparent",
                  WebkitTextStroke: "2px #F5F2ED",
                  marginBottom: "0.05em",
                }}
              >
                LOOK.
              </span>
            </div>
            <div className="overflow-hidden mb-2">
              <span
                className="sx-clip-reveal sx-clip-delay-3 block leading-none"
                aria-hidden="true"
                style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "clamp(64px, 9.5vw, 152px)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.9,
                  color: "#F5F2ED",
                  marginBottom: "0.05em",
                }}
              >
                YOUR
              </span>
            </div>
            <div className="overflow-hidden mb-8">
              <span
                className="sx-clip-reveal sx-clip-delay-4 block leading-none"
                aria-hidden="true"
                style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "clamp(64px, 9.5vw, 152px)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.9,
                  color: "#8B0D1A",
                }}
              >
                RULES.
              </span>
            </div>

            {/* Description */}
            {slide.description && (
              <p
                className="sx-fade-in sx-fade-delay-1 mb-8"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "15px",
                  fontWeight: 400,
                  lineHeight: 1.75,
                  color: "#9A9A8E",
                  maxWidth: "380px",
                }}
              >
                {slide.description}
              </p>
            )}

            {/* Social proof */}
            <div
              className="sx-fade-in sx-fade-delay-1 flex items-center gap-2 mb-6"
              style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#9A9A8E",
              }}
            >
              <span style={{ color: "#8B0D1A" }}>★★★★★</span>
              <span>500+ Satisfied Customers</span>
            </div>

            {/* CTAs */}
            <div className="sx-fade-in sx-fade-delay-2 flex flex-wrap items-center gap-4">
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

            {/* Scroll indicator */}
            <div
              className="hidden lg:flex items-center gap-3 mt-16 sx-fade-in sx-fade-delay-3"
              aria-hidden="true"
            >
              <div
                style={{ width: "1px", height: "40px", background: "#2A2A2A" }}
              />
              <span
                style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#2A2A2A",
                }}
              >
                SCROLL
              </span>
            </div>
          </div>
        </div>

        {/* ─── RED VERTICAL SEPARATOR ─────────────────── */}
        <div
          className="hidden lg:block absolute z-20"
          style={{
            left: "50%",
            top: "56px",
            bottom: "40px",
            width: "1px",
            background: "#8B0D1A",
            transformOrigin: "top",
            animation: "sx-clip-up 1s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both",
          }}
          aria-hidden="true"
        />

        {/* ─── RIGHT PANEL: Model image ────────────────── */}
        <div
          className="relative lg:flex-1"
          style={{
            minHeight: "50svh",
            overflow: "hidden",
          }}
        >
          {/* Model image — full bleed, NO overlay */}
          <Image
            src={slide.imageUrl}
            alt="SalarX — Men's Fashion Model"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-top"
            style={{ opacity: 1 }}
          />

          {/* Very subtle bottom gradient — ONLY to blend into the ticker */}
          <div
            className="absolute inset-x-0 bottom-0 h-16 z-10"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(11,11,11,0.6))",
            }}
            aria-hidden="true"
          />

          {/* Floating circular badge — top right area */}
          <div
            className="absolute top-8 right-8 z-20 sx-fade-in sx-fade-delay-3 hidden lg:flex"
            aria-hidden="true"
          >
            <CircularBadge />
          </div>

          {/* Floating product count tag */}
          <div
            className="absolute bottom-12 left-6 z-20 sx-fade-in sx-fade-delay-2 hidden lg:block"
            style={{
              background: "#0B0B0B",
              border: "1px solid #2A2A2A",
              padding: "12px 16px",
            }}
            aria-hidden="true"
          >
            <span
              style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#9A9A8E",
                display: "block",
                marginBottom: "4px",
              }}
            >
              COLLECTION SIZE
            </span>
            <span
              style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "28px",
                fontWeight: 900,
                color: "#F5F2ED",
                lineHeight: 1,
              }}
            >
              200+
            </span>
            <span
              style={{
                fontFamily: "'Inter', system-ui",
                fontSize: "11px",
                color: "#9A9A8E",
                display: "block",
              }}
            >
              Styles Available
            </span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM TICKER ────────────────────────────── */}
      <Ticker />
    </section>
  );
}