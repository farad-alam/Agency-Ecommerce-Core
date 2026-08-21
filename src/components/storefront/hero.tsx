"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

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

const SLIDE_INTERVAL_MS = 6000;

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      setCurrent((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const goTo = (index: number) => {
    setCurrent((index + slides.length) % slides.length);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured slides"
      className="relative min-h-[70vh] overflow-hidden bg-gray-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, i) => {
        const active = i === current;

        return (
          <div
            key={slide.imageUrl}
            className={`absolute inset-0 transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            aria-hidden={!active}
          >
            <Image
              src={slide.imageUrl}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 flex items-center justify-center px-4">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                {slide.eyebrow && (
                  <span className="inline-block rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-white">
                    {slide.eyebrow}
                  </span>
                )}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white">
                  {slide.title}
                </h1>
                {slide.description && (
                  <p className="text-lg md:text-xl text-gray-200">
                    {slide.description}
                  </p>
                )}
                {(slide.ctaLabel || slide.secondaryCtaLabel) && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    {slide.ctaLabel && (
                      <Link
                        href={slide.ctaHref}
                        tabIndex={active ? undefined : -1}
                        className="bg-white text-black px-8 py-4 rounded-md font-medium hover:bg-gray-100 transition-colors"
                      >
                        {slide.ctaLabel}
                      </Link>
                    )}
                    {slide.secondaryCtaLabel && (
                      <Link
                        href={slide.secondaryCtaHref ?? slide.ctaHref}
                        tabIndex={active ? undefined : -1}
                        className="border border-white/40 text-white px-8 py-4 rounded-md font-medium hover:bg-white/10 transition-colors"
                      >
                        {slide.secondaryCtaLabel}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 inset-x-0 z-10 flex items-center justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.imageUrl}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1} of ${slides.length}`}
                aria-current={i === current}
                className={`rounded-full transition-all ${i === current ? "bg-white w-8 h-2.5" : "bg-white/40 hover:bg-white/70 w-2.5 h-2.5"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}