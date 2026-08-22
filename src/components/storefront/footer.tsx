import Link from "next/link";

const SHOP_LINKS = [
  { label: "New Arrivals",    href: "/products?collection=new-arrivals" },
  { label: "Men's Wear",      href: "/products?category=mens-wear" },
  { label: "Women's Wear",    href: "/products?category=womens-wear" },
  { label: "Casual Wear",     href: "/products?category=casual" },
  { label: "Festive & Formal",href: "/products?category=formal" },
  { label: "Sale",            href: "/products?collection=sale" },
];

const HELP_LINKS = [
  { label: "About Us",           href: "/about" },
  { label: "Contact Us",         href: "/contact" },
  { label: "FAQs",               href: "/faq" },
  { label: "Size Guide",         href: "/size-guide" },
  { label: "Delivery & Shipping",href: "/shipping" },
  { label: "Returns & Exchange", href: "/returns" },
];

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export function Footer() {
  return (
    <footer
      style={{
        background: "#0B0B0B",
        borderTop: "2px solid #8B0D1A",
      }}
    >
      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Col 1 — Brand */}
          <div className="space-y-5">
            <Link href="/">
              <span
                style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "22px",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#F5F2ED",
                }}
              >
                SALAR<span style={{ color: "#8B0D1A" }}>X</span>
              </span>
            </Link>
            <p
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "13px",
                color: "#9A9A8E",
                lineHeight: 1.7,
              }}
            >
              Dress the Way You Feel.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {[
                { href: "https://facebook.com/salarx", icon: <FacebookIcon />, label: "Facebook" },
                { href: "https://instagram.com/salarx", icon: <InstagramIcon />, label: "Instagram" },
                { href: "https://wa.me/8801700000000", icon: <WhatsAppIcon />, label: "WhatsApp" },
              ].map(({ href, icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group flex items-center justify-center w-8 h-8 transition-all duration-200"
                  style={{
                    border: "1px solid #2A2A2A",
                    color: "#9A9A8E",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "#8B0D1A";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#8B0D1A";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "#2A2A2A";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#9A9A8E";
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Shop */}
          <div>
            <h3
              style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#F5F2ED",
                marginBottom: "20px",
              }}
            >
              Shop
            </h3>
            <ul className="space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: "13px",
                      color: "#9A9A8E",
                      transition: "color 0.2s",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#F5F2ED")}
                    onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#9A9A8E")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Help */}
          <div>
            <h3
              style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#F5F2ED",
                marginBottom: "20px",
              }}
            >
              Help & Info
            </h3>
            <ul className="space-y-3">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: "13px",
                      color: "#9A9A8E",
                      transition: "color 0.2s",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#F5F2ED")}
                    onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#9A9A8E")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <h3
              style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#F5F2ED",
                marginBottom: "20px",
              }}
            >
              Contact Us
            </h3>
            <ul className="space-y-4">
              {[
                { icon: "📍", text: "New Market, Chapainawabganj,\nRajshahi, Bangladesh" },
                { icon: "📞", text: "+8801700000000", href: "tel:+8801700000000" },
                { icon: "📧", text: "hello@salarx.com", href: "mailto:hello@salarx.com" },
                { icon: "🕐", text: "Mon–Sat: 9 AM – 9 PM" },
              ].map(({ icon, text, href }) => (
                <li key={text} className="flex items-start gap-2">
                  <span style={{ fontSize: "13px", lineHeight: "1.5", flexShrink: 0, marginTop: "1px" }}>{icon}</span>
                  {href ? (
                    <a href={href} style={{ fontFamily: "'Inter', system-ui", fontSize: "13px", color: "#9A9A8E", lineHeight: 1.6, textDecoration: "none" }}
                      onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#8B0D1A")}
                      onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#9A9A8E")}
                    >{text}</a>
                  ) : (
                    <span style={{ fontFamily: "'Inter', system-ui", fontSize: "13px", color: "#9A9A8E", lineHeight: 1.6, whiteSpace: "pre-line" }}>{text}</span>
                  )}
                </li>
              ))}
              <li>
                <a
                  href="https://wa.me/8801700000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-1 px-4 py-2 transition-opacity hover:opacity-90"
                  style={{ background: "#25D366", color: "#fff", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}
                >
                  <WhatsAppIcon />
                  WhatsApp Us
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ background: "#141414", borderTop: "1px solid #2A2A2A" }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p style={{ fontFamily: "'Inter', system-ui", fontSize: "12px", color: "#9A9A8E" }}>
            © {new Date().getFullYear()} SalarX. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Return Policy", href: "/returns" },
              { label: "Terms of Service", href: "/terms" },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                style={{ fontFamily: "'Inter', system-ui", fontSize: "11px", color: "#9A9A8E", letterSpacing: "0.05em" }}
                onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#F5F2ED")}
                onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#9A9A8E")}
              >{l.label}</Link>
            ))}
          </div>
          {/* Payment badges */}
          <div className="flex items-center gap-3">
            {["bKash", "Nagad", "COD"].map((badge) => (
              <span
                key={badge}
                style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "#9A9A8E",
                  border: "1px solid #2A2A2A",
                  padding: "3px 8px",
                  textTransform: "uppercase",
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
