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

/* ── Rotating circular badge ─────────────────────────────── */
function CircularBadge() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 110, height: 110 }} aria-hidden="true">
      <svg viewBox="0 0 110 110" width={110} height={110} className="sx-spin absolute inset-0">
        <defs>
          <path id="cbp" d="M 55,55 m -42,0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" />
        </defs>
        <text style={{ fontFamily: "'Montserrat',Arial,sans-serif", fontSize: "8px", fontWeight: 700, letterSpacing: "0.18em", fill: "#9A9A8E" }}>
          <textPath href="#cbp">BUILT DIFFERENT · MADE TO STAND OUT · </textPath>
        </text>
      </svg>
      <div className="relative z-10 flex items-center justify-center" style={{ width: 36, height: 36, border: "1px solid #2A2A2A" }}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="#F5F2ED">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
      </div>
    </div>
  );
}

/* ── Bottom marquee ticker ───────────────────────────────── */
function Ticker() {
  const items = ["NEW ARRIVALS", "MEN'S WEAR", "PREMIUM QUALITY", "FREE DELIVERY", "CHAPAINAWABGANJ", "GEN Z FASHION", "STREET STYLE", "SS 2026"];
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className="sx-marquee-track" style={{ background: "#8B0D1A", height: "40px", display: "flex", alignItems: "center", flexShrink: 0 }}>
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

/* ── NEW DROP card ───────────────────────────────────────── */
function NewDropCard() {
  return (
    <div className="sx-fade-in sx-fade-delay-2" style={{ background: "#141414", border: "1px solid #2A2A2A", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "center" }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: "'Montserrat',Arial,sans-serif", fontSize: "8px", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "#8B0D1A", display: "block", marginBottom: "6px" }}>
          NEW DROP 2026 +
        </span>
        <p style={{ fontFamily: "'Montserrat',Arial,sans-serif", fontSize: "14px", fontWeight: 800, color: "#F5F2ED", lineHeight: 1.2, marginBottom: "3px" }}>
          Oversized<br />Street Hoodie
        </p>
        <p style={{ fontFamily: "'Inter',system-ui", fontSize: "11px", color: "#9A9A8E", marginBottom: "10px" }}>
          Limited Edition Release
        </p>
        <button className="flex items-center gap-1.5" style={{ fontFamily: "'Montserrat',Arial,sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F5F2ED", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Play style={{ width: 10, height: 10, fill: "#8B0D1A", color: "#8B0D1A" }} />
          View Collection
        </button>
      </div>
      <div style={{ width: 64, height: 80, flexShrink: 0, position: "relative", background: "#1C1C1C", overflow: "hidden" }}>
        <Image src="/models/hero-model-transparent.png" alt="Preview" fill className="object-cover object-top" sizes="64px" />
      </div>
    </div>
  );
}

/* ── Shared big-word style ───────────────────────────────── */
const WORD_BASE: React.CSSProperties = {
  fontFamily: "'Montserrat', Arial, sans-serif",
  fontWeight: 900,
  fontSize: "clamp(58px, 8.5vw, 130px)",
  letterSpacing: "-0.04em",
  lineHeight: 0.9,
  whiteSpace: "nowrap",
  display: "block",
};

const STATS = [
  { value: "500+",   label: "Happy Customers" },
  { value: "4.9★",   label: "Customer Rating" },
  { value: "All BD", label: "Nationwide Delivery" },
];

/* ── Floating Stat Card ──────────────────────────────────── */
function FloatingStat({ value, label, floatDelay, style }: { value: string, label: string, floatDelay: string, style?: React.CSSProperties }) {
  return (
    <div className="sx-fade-in sx-fade-delay-2" style={style}>
      <div
        className="sx-float"
        style={{
          animationDelay: floatDelay,
          background: "rgba(11, 11, 11, 0.4)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "12px 18px",
          borderRadius: "12px",
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span style={{ fontFamily: "'Montserrat',Arial,sans-serif", fontSize: "16px", fontWeight: 900, color: "#F5F2ED", lineHeight: 1 }}>
          {value}
        </span>
        <span style={{ fontFamily: "'Inter',system-ui", fontSize: "9px", color: "#9A9A8E", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   HERO
════════════════════════════════════════════════════════════ */
export function Hero({ slides }: { slides: HeroSlide[] }) {
  const slide = slides[0];

  return (
    <section
      aria-label="Hero"
      style={{
        background: "#0B0B0B",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        paddingTop: "56px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── INTENSE SMOKY RED BACKGROUND (Matches Reference) ──────────────── */}
      {/* Base intense red flood */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 40% 30%, #cc0a1c 0%, #7a0410 45%, #120102 85%, #000000 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      
      {/* SVG Procedural Smoke Texture */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.65, /* High opacity for distinct physical smoke */
          mixBlendMode: "overlay", /* Overlay creates dark shadows and bright highlights (volumetric feel) */
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <svg width="100%" height="100%" preserveAspectRatio="none">
          <filter id="smoke-texture">
            {/* Lower frequency = bigger clouds, higher octaves = more wispy detail */}
            <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="5" stitchTiles="stitch" />
            {/* High contrast alpha channel to create distinct clumps of smoke instead of a uniform haze */}
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 4 -1.5" />
          </filter>
          <rect width="100%" height="100%" filter="url(#smoke-texture)" />
        </svg>
      </div>

      {/* Core volumetric spotlight directly behind model */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "40%", /* adjust to center */
          transform: "translate(-50%,-40%)",
          width: "60vw",
          height: "90%",
          background: "radial-gradient(ellipse at center, rgba(255, 30, 50, 0.4) 0%, rgba(200, 10, 25, 0.15) 50%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* ── MAIN AREA ─────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>

        {/* ═══════════════════════════════════════════════════
            BIG TEXT — z-index 1, behind model (z-index 20)
            Absolutely positioned so words bleed freely into
            the model's space without any grid clipping.
        ═══════════════════════════════════════════════════ */}

        {/* LEFT TOP: YOUR (flush) / LOOK (indented → K goes behind model) */}
        <div
          aria-hidden="true"
          style={{ position: "absolute", left: "8vw", top: "56px", zIndex: 1, pointerEvents: "none" }}
        >
          {/* YOUR — flush left */}
          <div style={{ overflow: "hidden" }}>
            <span
              className="sx-clip-reveal sx-clip-delay-1"
              style={{ ...WORD_BASE, color: "#F5F2ED" }}
            >
              YOUR
            </span>
          </div>
          {/* LOOK — indented ~11vw so K crosses into model zone but isn't fully hidden */}
          <div style={{ overflow: "hidden", paddingLeft: "11vw" }}>
            <span
              className="sx-clip-reveal sx-clip-delay-2"
              style={{ ...WORD_BASE, color: "#8B0D1A" }}
            >
              LOOK
            </span>
          </div>
        </div>

        {/* RIGHT TOP: Floating Stats + New Drop Card */}
        <div
          style={{ position: "absolute", right: "8vw", top: "120px", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "40px" }}
        >
          {/* FLOATING STATS */}
          <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
            <FloatingStat value="500+" label="Happy Customers" floatDelay="0s" style={{ transform: "translateY(25px)" }} />
            <FloatingStat value="4.9★" label="Customer Rating" floatDelay="1.5s" style={{ transform: "translateY(-5px)" }} />
            <FloatingStat value="All BD" label="Nationwide Delivery" floatDelay="0.75s" style={{ transform: "translateY(40px)" }} />
          </div>

          <div style={{ width: "100%", maxWidth: "300px" }}>
            <NewDropCard />
          </div>
        </div>
        {/* ═══════════════════════════════════════════════════
            MODEL — z-index 20, on top of text
        ═══════════════════════════════════════════════════ */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: "40px",
            bottom: 0,
            width: "36%",
            zIndex: 20,
          }}
        >
          <Image
            src={slide.imageUrl}
            alt="SalarX — Men's fashion model"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-contain object-bottom"
            style={{ transform: "scale(1.1)", transformOrigin: "bottom center" }}
          />
        </div>

        {/* ═══════════════════════════════════════════════════
            BOTTOM CONTENT
        ═══════════════════════════════════════════════════ */}
        {/* Left Bottom: description + CTA */}
        <div
          style={{
            position: "absolute",
            bottom: "100px",
            left: "8vw",
            zIndex: 5,
          }}
        >
          <div className="sx-fade-in sx-fade-delay-1" style={{ maxWidth: "320px" }}>
            <p className="sx-label" style={{ marginBottom: "16px", color: "#000000", fontWeight: 900, whiteSpace: "nowrap" }}>
              {slide.eyebrow ?? "Men's Fashion. GEN-Z Edition"}
            </p>
            <p style={{ fontFamily: "'Inter',system-ui", fontSize: "14px", color: "rgba(245, 242, 237, 0.85)", lineHeight: 1.75, marginBottom: "20px" }}>
              {slide.description ?? "Future-ready streetwear crafted for creators, trendsetters, and everyday explorers."}
            </p>
            <Link href={slide.ctaHref} className="sx-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              {slide.ctaLabel ?? "Discover The Collection"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right Bottom: YOUR (indented) / RULES (flush right) */}
        <div
          aria-hidden="true"
          style={{ position: "absolute", right: "8vw", bottom: "16px", zIndex: 1, pointerEvents: "none", textAlign: "right" }}
        >
          {/* YOUR — indented ~11vw from right so Y crosses into model but isn't fully hidden */}
          <div style={{ overflow: "hidden", paddingRight: "11vw" }}>
            <span
              className="sx-clip-reveal sx-clip-delay-1"
              style={{ ...WORD_BASE, color: "transparent", WebkitTextStroke: "1.5px #F5F2ED" } as React.CSSProperties}
            >
              YOUR
            </span>
          </div>
          {/* RULES — flush right */}
          <div style={{ overflow: "hidden" }}>
            <span
              className="sx-clip-reveal sx-clip-delay-2"
              style={{ ...WORD_BASE, color: "#F5F2ED" }}
            >
              RULES.
            </span>
          </div>
        </div>
      </div>{/* end main area */}



      {/* ── TICKER ────────────────────────────────────────── */}
      <Ticker />
    </section>
  );
}