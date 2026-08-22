"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

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

/* ── Rotating circular text badge ──────────────────────── */
function CircularBadge() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 110, height: 110 }} aria-hidden="true">
      <svg viewBox="0 0 110 110" width={110} height={110} className="sx-spin absolute inset-0">
        <defs>
          <path id="cbp" d="M 55,55 m -42,0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" />
        </defs>
        <text style={{ fontFamily: "'Montserrat',Arial,sans-serif", fontSize: "8px", fontWeight: 700, letterSpacing: "0.18em", fill: "#9A9A8E", textTransform: "uppercase" }}>
          <textPath href="#cbp">BUILT DIFFERENT · MADE TO STAND OUT · </textPath>
        </text>
      </svg>
      {/* Star center */}
      <div className="relative z-10 flex items-center justify-center" style={{ width: 36, height: 36, border: "1px solid #2A2A2A" }}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="#F5F2ED">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
      </div>
    </div>
  );
}

/* ── Bottom scrolling ticker ────────────────────────────── */
function Ticker() {
  const items = [
    "NEW ARRIVALS", "MEN'S WEAR", "PREMIUM QUALITY",
    "FREE DELIVERY", "CHAPAINAWABGANJ", "GEN Z FASHION",
    "STREET STYLE", "SS 2026",
  ];
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className="sx-marquee-track" style={{ background: "#8B0D1A", height: "40px", display: "flex", alignItems: "center" }}>
      <div className="sx-marquee" aria-hidden="true">
        {repeated.map((item, i) => (
          <span key={i} style={{ fontFamily: "'Montserrat',Arial,sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#F5F2ED", whiteSpace: "nowrap", padding: "0 32px" }}>
            {item} <span style={{ opacity: 0.5, marginLeft: "32px" }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Giant headline word ────────────────────────────────── */
type WordProps = {
  children: React.ReactNode;
  variant?: "solid" | "outline" | "red";
  delay?: string;
  align?: "left" | "right";
};
function Word({ children, variant = "solid", delay = "0s", align = "left" }: WordProps) {
  const color =
    variant === "red"    ? "#8B0D1A" :
    variant === "outline"? "transparent" : "#F5F2ED";
  const stroke = variant === "outline" ? "1.5px #F5F2ED" : "none";

  return (
    <div style={{ overflow: "hidden", lineHeight: 1 }}>
      <span
        className="sx-clip-reveal block"
        style={{
          fontFamily: "'Montserrat', Arial, sans-serif",
          fontSize: "clamp(60px, 9.5vw, 148px)",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          lineHeight: 0.88,
          color,
          WebkitTextStroke: stroke as any,
          display: "block",
          animationDelay: delay,
          textAlign: align,
        }}
      >
        {children}
      </span>
    </div>
  );
}

/* ── NEW DROP floating card ─────────────────────────────── */
function NewDropCard() {
  return (
    <div
      className="sx-fade-in sx-fade-delay-2"
      style={{ background: "#141414", border: "1px solid #2A2A2A", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "center" }}
    >
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: "'Montserrat',Arial,sans-serif", fontSize: "8px", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "#8B0D1A", display: "block", marginBottom: "6px" }}>
          NEW DROP 2026 +
        </span>
        <p style={{ fontFamily: "'Montserrat',Arial,sans-serif", fontSize: "15px", fontWeight: 800, color: "#F5F2ED", lineHeight: 1.2, marginBottom: "3px" }}>
          Oversized<br />Street Hoodie
        </p>
        <p style={{ fontFamily: "'Inter',system-ui", fontSize: "11px", color: "#9A9A8E", marginBottom: "10px" }}>
          Limited Edition Release
        </p>
        <button
          className="flex items-center gap-1.5"
          style={{ fontFamily: "'Montserrat',Arial,sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F5F2ED", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <Play style={{ width: 10, height: 10, fill: "#8B0D1A", color: "#8B0D1A" }} />
          View Collection
        </button>
      </div>
      {/* Thumbnail */}
      <div style={{ width: 72, height: 88, flexShrink: 0, position: "relative", background: "#1C1C1C", overflow: "hidden" }}>
        <Image
          src="/models/hero-model-center.png"
          alt="New drop preview"
          fill
          className="object-cover object-top"
          sizes="72px"
          style={{ mixBlendMode: "screen" }}
        />
      </div>
    </div>
  );
}

/* ── STATS row ──────────────────────────────────────────── */
const STATS = [
  { value: "500+",  label: "Happy Customers" },
  { value: "4.9★",  label: "Customer Rating" },
  { value: "All BD",label: "Nationwide Delivery" },
];

/* ════════════════════════════════════════════════════════════
   MAIN HERO COMPONENT
════════════════════════════════════════════════════════════ */
export function Hero({ slides }: { slides: HeroSlide[] }) {
  const slide = slides[0];

  return (
    <section
      aria-label="Hero"
      style={{ background: "#0B0B0B", minHeight: "100svh", display: "flex", flexDirection: "column", paddingTop: "56px", position: "relative", overflow: "hidden" }}
    >
      {/* ── Red glow behind center model ───────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "30%",
          transform: "translate(-50%, -30%)",
          width: "40vw",
          height: "70vh",
          background: "radial-gradient(ellipse at center, rgba(139,13,26,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ═══════════════════════════════════════════════════
          MAIN 3-COLUMN BODY
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 30% 1fr",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── LEFT COLUMN ─────────────────────────────── */}
        <div
          className="flex flex-col justify-between"
          style={{ padding: "48px 0 32px 40px" }}
        >
          {/* Top: Eyebrow + big words */}
          <div>
            {/* Eyebrow */}
            <p
              className="sx-fade-in"
              style={{
                fontFamily: "'Montserrat',Arial,sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "#9A9A8E",
                textTransform: "uppercase",
                marginBottom: "28px",
                fontStyle: "italic",
              }}
            >
              // {slide.eyebrow ?? "Men's Fashion · 2026"}
            </p>

            {/* Big left words: YOUR / RULES. */}
            <Word variant="solid" delay="0.05s" align="left">YOUR</Word>
            <div style={{ height: "0.05em" }} />
            <Word variant="red" delay="0.25s" align="left">RULES.</Word>
          </div>

          {/* Bottom: Description + CTA */}
          <div className="sx-fade-in sx-fade-delay-1">
            <p style={{ fontFamily: "'Inter',system-ui", fontSize: "14px", color: "#9A9A8E", lineHeight: 1.75, marginBottom: "24px", maxWidth: "300px" }}>
              {slide.description ?? "Future-ready streetwear crafted for creators, trendsetters, and everyday explorers."}
            </p>
            <Link
              href={slide.ctaHref}
              className="sx-btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              {slide.ctaLabel ?? "Discover The Collection"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* ── CENTER COLUMN: Model ────────────────────── */}
        <div
          style={{
            position: "relative",
            zIndex: 20,
            /* overflow visible so model can bleed into text columns */
            overflow: "visible",
          }}
        >
          <div
            style={{
              position: "absolute",
              /* bleed above and below */
              top: "-20px",
              bottom: "0",
              /* bleed left and right into text columns */
              left: "-60px",
              right: "-60px",
            }}
          >
            <Image
              src="/models/hero-model-center.png"
              alt="SalarX — Men's fashion model"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-contain object-bottom"
              style={{
                /* black bg blends with page via screen blend mode */
                mixBlendMode: "screen",
              }}
            />
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────── */}
        <div
          className="flex flex-col justify-between"
          style={{ padding: "48px 40px 32px 0", alignItems: "flex-end" }}
        >
          {/* Top: Badge + big words */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            {/* Circular badge */}
            <div className="sx-fade-in mb-6">
              <CircularBadge />
            </div>

            {/* Big right words: YOUR / LOOK. */}
            <Word variant="outline" delay="0.15s" align="right">YOUR</Word>
            <div style={{ height: "0.05em" }} />
            <Word variant="solid" delay="0.35s" align="right">LOOK.</Word>
          </div>

          {/* Bottom: italic subtext + NEW DROP card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "16px" }}>
            <p
              className="sx-fade-in sx-fade-delay-1"
              style={{ fontFamily: "'Inter',system-ui", fontSize: "13px", fontStyle: "italic", color: "#9A9A8E", lineHeight: 1.65, textAlign: "right", maxWidth: "260px" }}
            >
              Modern Silhouettes. Premium Fabrics.<br />Limitless Expression.
            </p>
            <div style={{ width: "100%", maxWidth: "280px" }}>
              <NewDropCard />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM STATS BAR
      ═══════════════════════════════════════════════════ */}
      <div
        className="sx-fade-in sx-fade-delay-2"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          borderTop: "1px solid #2A2A2A",
          position: "relative",
          zIndex: 5,
          background: "#0B0B0B",
        }}
      >
        {/* Stats */}
        <div style={{ display: "flex", gap: "48px" }}>
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <span style={{ fontFamily: "'Montserrat',Arial,sans-serif", fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 900, color: "#F5F2ED", display: "block", lineHeight: 1 }}>
                {value}
              </span>
              <span style={{ fontFamily: "'Inter',system-ui", fontSize: "11px", color: "#9A9A8E", marginTop: "3px", display: "block" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Right: worldwide + dots */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontFamily: "'Montserrat',Arial,sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9A9A8E" }}>
            🌐&nbsp; / Nationwide Delivery
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{ width: 7, height: 7, borderRadius: "50%", background: i === 0 ? "#8B0D1A" : "#2A2A2A" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM RED TICKER
      ═══════════════════════════════════════════════════ */}
      <Ticker />
    </section>
  );
}