"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart-provider";
import { ShoppingCart, Menu, X, User, Search } from "lucide-react";
import { useSession } from "next-auth/react";

const NAV_LINKS = [
  { label: "Men's Wear",   href: "/products?category=mens-wear" },
  { label: "Women's Wear", href: "/products?category=womens-wear" },
  { label: "Collections",  href: "/products?collection=all" },
  { label: "New Arrivals", href: "/products?collection=new-arrivals" },
  { label: "About",        href: "/about" },
];

export function Navbar() {
  const { itemCount, openDrawer } = useCart();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll(); // initialize on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navBg = isHome && !scrolled
    ? "bg-transparent"
    : "bg-[#0B0B0B] transition-colors duration-300";

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${navBg}`}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span
              className="font-heading text-xl font-black tracking-wider uppercase"
              style={{
                color: "#F5F2ED",
                letterSpacing: "0.08em",
                fontFamily: "'Montserrat', Arial, sans-serif",
              }}
            >
              SALAR<span style={{ color: "#8B0D1A" }}>X</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#F5F2ED]/80 hover:text-[#8B0D1A] transition-colors duration-200"
                style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-4">
            <Link
              href={session ? "/account" : "/login"}
              className="hidden md:flex text-[#F5F2ED]/70 hover:text-[#8B0D1A] transition-colors duration-200"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>

            <button
              onClick={openDrawer}
              className="relative text-[#F5F2ED]/70 hover:text-[#8B0D1A] transition-colors duration-200 p-1"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#8B0D1A] text-[#F5F2ED] text-[9px] font-bold leading-none">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-[#F5F2ED]/70 hover:text-[#8B0D1A] transition-colors p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-[#0B0B0B] border-t border-[#2A2A2A]">
            <nav className="flex flex-col px-6 py-6 gap-5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[#F5F2ED] hover:text-[#8B0D1A] transition-colors duration-200 border-b border-[#2A2A2A] pb-4"
                  style={{
                    fontFamily: "'Montserrat', Arial, sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={session ? "/account" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-[#9A9A8E] hover:text-[#8B0D1A] transition-colors mt-2"
                style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                <User className="h-4 w-4" />
                {session ? "My Account" : "Sign In"}
              </Link>
              <a
                href="https://wa.me/8801700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mt-2 px-4 py-3"
                style={{
                  background: "#25D366",
                  color: "#fff",
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp Us
              </a>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
