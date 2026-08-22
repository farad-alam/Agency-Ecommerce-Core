import { getStorefrontProducts } from "@/storefront-sdk";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/storefront/product-card";
import { Hero, type HeroSlide } from "@/components/storefront/hero";
import { TrustBar } from "@/components/storefront/trust-bar";
import { Truck, CreditCard, RefreshCw, ShieldCheck, Star, ArrowRight } from "lucide-react";

/* ─── HERO DATA ─────────────────────────────────────────── */
const heroSlide: HeroSlide = {
  eyebrow: "Men's Fashion · Gen Z Edition",
  title: "YOUR",
  titleAccent: "RULES.",
  description:
    "Premium menswear for the ones who set the trends — not follow them. Delivered anywhere in Bangladesh.",
  imageUrl: "/models/hero-model-transparent.png",
  ctaLabel: "Shop New Arrivals",
  ctaHref: "/products?collection=new-arrivals",
  secondaryCtaLabel: "Browse All",
  secondaryCtaHref: "/products",
};

/* ─── CATEGORIES ─────────────────────────────────────────── */
const CATEGORIES = [
  {
    label: "Men's Wear",
    bangla: "পুরুষদের পোশাক",
    href: "/products?category=mens-wear",
    imageUrl:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop",
  },
  {
    label: "Women's Wear",
    bangla: "মহিলাদের পোশাক",
    href: "/products?category=womens-wear",
    imageUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=600&auto=format&fit=crop",
  },
  {
    label: "Casual Wear",
    bangla: "আরামদায়ক পোশাক",
    href: "/products?category=casual",
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop",
  },
  {
    label: "Festive & Formal",
    bangla: "উৎসবের পোশাক",
    href: "/products?category=formal",
    imageUrl:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600&auto=format&fit=crop",
  },
];

/* ─── REVIEWS ────────────────────────────────────────────── */
const REVIEWS = [
  {
    name: "Rakib H.",
    location: "Dhaka",
    text: "I was nervous ordering online, but SalarX impressed me from my very first order. The fabric quality felt more premium than what I paid for!",
    rating: 5,
    initials: "RH",
  },
  {
    name: "Nasrin A.",
    location: "Rajshahi",
    text: "Delivery was super fast — only 2 days to Rajshahi. The kurta fits perfectly and the colour is exactly as shown in the photo. No surprises, just a great experience.",
    rating: 5,
    initials: "NA",
  },
  {
    name: "Tanvir M.",
    location: "Chapainawabganj",
    text: "Local shop going online! SalarX erased every doubt I had. The product quality is outstanding and the team is very responsive on WhatsApp.",
    rating: 5,
    initials: "TM",
  },
  {
    name: "Sumaiya K.",
    location: "Chittagong",
    text: "Bought the women's linen set for Eid and got so many compliments. The packaging was neat and the product looked exactly like the pictures. Will order again!",
    rating: 5,
    initials: "SK",
  },
];

/* ─── DELIVERY INFO ──────────────────────────────────────── */
const DELIVERY_ITEMS = [
  {
    Icon: Truck,
    heading: "Fast Delivery Nationwide",
    body: "We deliver to all districts across Bangladesh. Estimated 2–5 working days. Shipped via Steadfast / Pathao Courier.",
  },
  {
    Icon: CreditCard,
    heading: "Flexible Payment",
    body: "Pay with bKash, Nagad, or Rocket. Cash on Delivery (COD) also available. 100% safe transactions.",
  },
  {
    Icon: RefreshCw,
    heading: "7-Day Easy Exchange",
    body: "Not happy with the fit? Exchange within 7 days of delivery. Just WhatsApp us and we'll sort it out.",
  },
  {
    Icon: ShieldCheck,
    heading: "Quality Guaranteed",
    body: "Every product is personally checked before shipping. What you see in the photo is exactly what you receive.",
  },
];

/* ─── SECTION HEADING HELPER ─────────────────────────────── */
function SectionHeading({
  label,
  title,
  subtitle,
  align = "left",
}: {
  label: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <div
        className={`sx-label mb-4 ${align === "center" ? "justify-center" : ""}`}
        style={align === "center" ? { justifyContent: "center" } : {}}
      >
        {label}
      </div>
      <h2
        style={{
          fontFamily: "'Montserrat', Arial, sans-serif",
          fontSize: "clamp(28px, 4vw, 48px)",
          fontWeight: 800,
          letterSpacing: "-0.01em",
          textTransform: "uppercase",
          color: "#F5F2ED",
          lineHeight: 1.1,
          marginBottom: subtitle ? "12px" : "0",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "15px",
            color: "#9A9A8E",
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ─── PAGE ───────────────────────────────────────────────── */
export default async function StorefrontHomepage() {
  const [newArrivals, bestSellers] = await Promise.all([
    getStorefrontProducts({ limit: 8, sort: "newest" }),
    getStorefrontProducts({ limit: 4, sort: "newest" }),
  ]);

  return (
    <div style={{ background: "#0B0B0B" }}>

      {/* ── SECTION 3: HERO ──────────────────────────────────── */}
      <Hero slides={[heroSlide]} />

      {/* ── SECTION 4: TRUST BAR ─────────────────────────────── */}
      <TrustBar />

      {/* ── SECTION 5: CATEGORIES ────────────────────────────── */}
      <section style={{ background: "#0B0B0B", padding: "96px 0" }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-end justify-between mb-10 gap-4">
            <SectionHeading
              label="Find What You Love"
              title="Shop by Category"
              subtitle="Find exactly what you're looking for — fast."
            />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group block relative overflow-hidden"
                style={{ aspectRatio: "2/3" }}
              >
                <Image
                  src={cat.imageUrl}
                  alt={cat.label}
                  fill
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 transition-all duration-300 group-hover:opacity-80"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(11,11,11,0.9) 0%, rgba(11,11,11,0.3) 60%)",
                  }}
                />
                {/* Red bottom border on hover */}
                <div
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[#8B0D1A] transition-all duration-300 scale-x-0 group-hover:scale-x-100 origin-left"
                />
                {/* Text */}
                <div className="absolute inset-x-0 bottom-0 p-4 z-10">
                  <span
                    style={{
                      fontFamily: "'Montserrat', Arial, sans-serif",
                      fontSize: "14px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#F5F2ED",
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    {cat.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: "11px",
                      color: "#9A9A8E",
                      display: "block",
                    }}
                  >
                    {cat.bangla}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: NEW ARRIVALS ──────────────────────────── */}
      <section style={{ background: "#0B0B0B", padding: "0 0 96px" }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-end justify-between mb-10 gap-4">
            <SectionHeading
              label="Fresh Off the Rack"
              title="Just Dropped ✨"
              subtitle="Our newest styles — added this week."
            />
            <Link
              href="/products?sort=newest"
              className="flex items-center gap-2 flex-shrink-0 transition-colors duration-200 hover:text-[#8B0D1A]"
              style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#9A9A8E",
              }}
            >
              See All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {newArrivals.data.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {newArrivals.data.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product as any}
                  badge="new"
                />
              ))}
            </div>
          ) : (
            <div
              className="py-16 text-center"
              style={{
                background: "#141414",
                border: "1px solid #2A2A2A",
                fontFamily: "'Inter', system-ui",
                fontSize: "14px",
                color: "#9A9A8E",
              }}
            >
              New arrivals coming soon — check back shortly.
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 7: BEST SELLERS ──────────────────────────── */}
      {/* Banner */}
      <div
        style={{
          background: "#141414",
          padding: "64px 0",
          borderTop: "1px solid #2A2A2A",
          borderBottom: "1px solid #2A2A2A",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <p
            style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "clamp(36px, 6vw, 80px)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#F5F2ED",
              lineHeight: 1,
            }}
          >
            What Everyone&apos;s{" "}
            <span style={{ color: "#8B0D1A", borderBottom: "3px solid #8B0D1A" }}>
              Buying
            </span>
          </p>
        </div>
      </div>

      <section style={{ background: "#0B0B0B", padding: "64px 0 96px" }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-end justify-between mb-10 gap-4">
            <SectionHeading
              label="Customer Favourites"
              title="Our Best Sellers 🏆"
              subtitle="The pieces our customers love most — and keep coming back for."
            />
            <Link
              href="/products"
              className="flex items-center gap-2 flex-shrink-0 transition-colors duration-200 hover:text-[#8B0D1A]"
              style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#9A9A8E",
              }}
            >
              Shop All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {bestSellers.data.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {bestSellers.data.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product as any}
                  badge="bestseller"
                />
              ))}
            </div>
          ) : (
            <div
              className="py-16 text-center"
              style={{
                background: "#141414",
                border: "1px solid #2A2A2A",
                fontFamily: "'Inter', system-ui",
                fontSize: "14px",
                color: "#9A9A8E",
              }}
            >
              Add products to display best sellers.
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 8: BRAND STORY ───────────────────────────── */}
      <section
        style={{
          background: "#0B0B0B",
          borderTop: "1px solid #2A2A2A",
          padding: "96px 0",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div
              className="relative"
              style={{
                aspectRatio: "4/5",
                border: "1px solid #2A2A2A",
              }}
            >
              <Image
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop"
                alt="SalarX store"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Red right border accent */}
              <div
                className="absolute right-0 top-8 bottom-8 w-0.5"
                style={{ background: "#8B0D1A" }}
              />
            </div>

            {/* Text */}
            <div className="space-y-7">
              <div className="sx-label">Our Story</div>
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "clamp(32px, 4vw, 52px)",
                  fontWeight: 700,
                  color: "#F5F2ED",
                  lineHeight: 1.15,
                }}
              >
                Born in Chapainawabganj.
                <br />
                <em style={{ fontStyle: "italic", color: "#8B0D1A" }}>
                  Built for Bangladesh.
                </em>
              </h2>
              <div
                style={{ width: "48px", height: "2px", background: "#8B0D1A" }}
              />
              <div
                className="space-y-4"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "15px",
                  color: "#9A9A8E",
                  lineHeight: 1.8,
                }}
              >
                <p>
                  SalarX started as a small clothing shop in the heart of New
                  Market, Chapainawabganj — a single rack of handpicked styles
                  and a belief that everyone deserves to dress well, without
                  compromise.
                </p>
                <p>
                  We personally select every piece in our collection based on
                  three things: quality of fabric, accuracy of fit, and value for
                  money. No shortcuts, no overpriced labels — just clothes that
                  look great and feel even better.
                </p>
                <p>
                  Today, we serve customers across Bangladesh — from our physical
                  store in Chapainawabganj to doorsteps in Dhaka, Chittagong, and
                  beyond.
                </p>
              </div>

              {/* Stat pills */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  { value: "1", label: "Physical Store" },
                  { value: "500+", label: "Orders Delivered" },
                  { value: "4.9★", label: "Average Rating" },
                  { value: "All BD", label: "Nationwide Delivery" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    style={{
                      background: "#141414",
                      border: "1px solid #2A2A2A",
                      padding: "16px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Montserrat', Arial, sans-serif",
                        fontSize: "22px",
                        fontWeight: 800,
                        color: "#8B0D1A",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      {value}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: "12px",
                        color: "#9A9A8E",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <Link href="/about" className="sx-btn-primary inline-flex">
                Read Our Full Story <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 9: REVIEWS ───────────────────────────────── */}
      <section
        style={{
          background: "#141414",
          borderTop: "1px solid #2A2A2A",
          padding: "96px 0",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <div className="sx-label justify-center mb-4" style={{ justifyContent: "center" }}>
              What They Say
            </div>
            <h2
              style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                textTransform: "uppercase",
                color: "#F5F2ED",
              }}
            >
              Loved by Our Customers ❤️
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {REVIEWS.map((review) => (
              <div
                key={review.name}
                style={{
                  background: "#0B0B0B",
                  border: "1px solid #2A2A2A",
                  padding: "28px",
                }}
              >
                {/* Opening quote */}
                <span
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "56px",
                    lineHeight: 1,
                    color: "#8B0D1A",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  "
                </span>

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5"
                      style={{ color: "#8B0D1A", fill: "#8B0D1A" }}
                    />
                  ))}
                </div>

                {/* Review text */}
                <p
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: "14px",
                    color: "#F5F2ED",
                    lineHeight: 1.75,
                    marginBottom: "20px",
                  }}
                >
                  {review.text}
                </p>

                {/* Customer info */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-9 h-9 flex-shrink-0"
                    style={{
                      background: "#8B0D1A",
                      fontFamily: "'Montserrat', Arial, sans-serif",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#F5F2ED",
                    }}
                  >
                    {review.initials}
                  </div>
                  <div>
                    <span
                      style={{
                        fontFamily: "'Montserrat', Arial, sans-serif",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#F5F2ED",
                        display: "block",
                      }}
                    >
                      {review.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: "11px",
                        color: "#9A9A8E",
                      }}
                    >
                      {review.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 11: DELIVERY & PAYMENT ───────────────────── */}
      <section style={{ background: "#F5F2ED", padding: "80px 0" }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
            {DELIVERY_ITEMS.map(({ Icon, heading, body }, i) => (
              <div
                key={heading}
                className="flex flex-col items-center text-center px-6"
                style={{
                  borderRight:
                    i < DELIVERY_ITEMS.length - 1
                      ? "1px solid #2A2A2A20"
                      : "none",
                }}
              >
                <div
                  className="flex items-center justify-center w-12 h-12 mb-5"
                  style={{ background: "#8B0D1A" }}
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={1.5} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Montserrat', Arial, sans-serif",
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "#0B0B0B",
                    marginBottom: "10px",
                  }}
                >
                  {heading}
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: "13px",
                    color: "#5A5A52",
                    lineHeight: 1.7,
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 12: WHATSAPP / NEWSLETTER CTA ────────────── */}
      <section
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{ borderTop: "1px solid #2A2A2A" }}
      >
        {/* Left — Newsletter */}
        <div
          style={{
            background: "#141414",
            padding: "72px 48px",
          }}
        >
          <div className="sx-label mb-5">Stay in the Loop</div>
          <h2
            style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "clamp(22px, 3vw, 32px)",
              fontWeight: 800,
              textTransform: "uppercase",
              color: "#F5F2ED",
              lineHeight: 1.2,
              marginBottom: "12px",
            }}
          >
            Get Exclusive Deals & New Arrivals First
          </h2>
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "14px",
              color: "#9A9A8E",
              lineHeight: 1.7,
              marginBottom: "28px",
              maxWidth: "360px",
            }}
          >
            Join 500+ shoppers who get early access to sales, new drops, and
            special discount codes. No spam — ever.
          </p>
          <form className="flex gap-0">
            <input
              type="email"
              placeholder="Your email address..."
              required
              style={{
                flex: 1,
                padding: "14px 16px",
                background: "#0B0B0B",
                border: "1px solid #2A2A2A",
                borderRight: "none",
                color: "#F5F2ED",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button type="submit" className="sx-btn-primary" style={{ borderRadius: 0 }}>
              Subscribe
            </button>
          </form>
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "11px",
              color: "#9A9A8E",
              marginTop: "12px",
            }}
          >
            🔒 We respect your privacy. Unsubscribe anytime.
          </p>
        </div>

        {/* Right — WhatsApp */}
        <div
          style={{
            background: "#8B0D1A",
            padding: "72px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            className="sx-label mb-5"
            style={{ color: "rgba(245,242,237,0.6)" }}
          >
            <span
              style={{
                display: "inline-block",
                width: "36px",
                height: "1px",
                background: "rgba(245,242,237,0.4)",
                marginRight: "12px",
                verticalAlign: "middle",
              }}
            />
            Need Help?
          </div>
          <h2
            style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "clamp(22px, 3vw, 32px)",
              fontWeight: 800,
              textTransform: "uppercase",
              color: "#F5F2ED",
              lineHeight: 1.2,
              marginBottom: "12px",
            }}
          >
            Chat with Us on WhatsApp
          </h2>
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "14px",
              color: "rgba(245,242,237,0.7)",
              lineHeight: 1.7,
              marginBottom: "28px",
              maxWidth: "360px",
            }}
          >
            Ask about sizing, delivery timelines, or anything else. Our team
            replies within 1 hour during business hours (Mon–Sat, 9 AM–9 PM).
          </p>
          <a
            href="https://wa.me/8801700000000?text=Hi%20SalarX%2C%20I%20have%20a%20question%20about..."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 hover:opacity-90 transition-opacity duration-200"
            style={{
              background: "#F5F2ED",
              color: "#0B0B0B",
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "14px 28px",
              textDecoration: "none",
              width: "fit-content",
            }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
