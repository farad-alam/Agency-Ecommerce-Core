"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ShoppingBag, Star } from "lucide-react";

export type HeroSlide = {
  eyebrow?: string;
  title: string;
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
      aria-label="Featured slide"
      className="relative overflow-visible bg-[#D3113D]"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-center">
          {/* Left — copy */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-7">
            {slide.eyebrow && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white">
                {slide.eyebrow}
              </span>
            )}
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white">
              {slide.title}
            </h1>
            {slide.description && (
              <p className="max-w-xl text-lg md:text-xl text-white/85">
                {slide.description}
              </p>
            )}
            {(slide.ctaLabel || slide.secondaryCtaLabel) && (
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {slide.ctaLabel && (
                  <Link
                    href={slide.ctaHref}
                    className="inline-flex items-center gap-2.5 rounded-full bg-[#F56C73] px-8 py-3.5 text-base font-medium text-white shadow-[0_10px_30px_rgba(245,108,115,0.45)] hover:bg-[#ED2746] transition-colors"
                  >
                    {slide.ctaLabel}
                    <ShoppingBag className="h-4 w-4" />
                  </Link>
                )}
                {slide.secondaryCtaLabel && (
                  <Link
                    href={slide.secondaryCtaHref ?? slide.ctaHref}
                    className="inline-flex items-center gap-2.5 rounded-full border-2 border-white/70 bg-transparent px-8 py-3.5 text-base font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    {slide.secondaryCtaLabel}
                    <ChevronDown className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right — circular image + floating review card */}
          <div className="lg:col-span-5 lg:-mt-10 relative">
            <div className="relative mx-auto aspect-square w-full max-w-[420px] lg:max-w-none overflow-hidden rounded-full bg-[#FDE9EC]">
              <Image
                src={slide.imageUrl}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 420px, 460px"
                className="object-cover"
              />
            </div>

            <div className="absolute -left-4 sm:-left-8 -bottom-8 flex items-center gap-3 rounded-full bg-[#FDE9EC] py-3 pl-4 pr-6 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              <div className="flex -space-x-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#FDE9EC] bg-[#F56C73] text-[10px] font-bold text-white">
                  SM
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#FDE9EC] bg-[#ED2746] text-[10px] font-bold text-white">
                  AR
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#FDE9EC] bg-[#1A1A1A] text-[10px] font-bold text-white">
                  J
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#1A1A1A]">Our Happy Customer</p>
                <div className="flex items-center gap-1 text-[#1A1A1A]">
                  <span className="flex text-[#ED2746]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < 4 ? "fill-[#ED2746]" : "fill-[#ED2746]/30 text-[#ED2746]/30"}`}
                      />
                    ))}
                  </span>
                  <span className="text-[11px] font-bold">4.5</span>
                  <span className="text-[11px] text-[#1A1A1A]/60">(453k Reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}