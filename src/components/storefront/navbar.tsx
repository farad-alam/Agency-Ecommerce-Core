"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart-provider";
import { ShoppingCart, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";

export function Navbar() {
  const { itemCount } = useCart();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = pathname === "/";

  const linkClass = isHome
    ? "text-white/85 hover:text-white"
    : "text-gray-600 hover:text-black";

  return (
    <header className={isHome ? "absolute inset-x-0 top-0 z-50" : "sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md"}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className={`text-xl font-bold tracking-tighter ${isHome ? "font-heading text-white" : ""}`}>
            STORE
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="/products" className={linkClass}>All Products</Link>
            <Link href="/products?category=apparel" className={linkClass}>Apparel</Link>
            <Link href="/products?category=electronics" className={linkClass}>Electronics</Link>
            <Link href="/products?collection=new-arrivals" className={linkClass}>New Arrivals</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href={session ? "/account" : "/login"} className={`${linkClass} hidden md:flex items-center gap-2 text-sm font-medium`}>
            <User className="h-5 w-5" />
            <span className="sr-only sm:not-sr-only">{session ? "Account" : "Sign In"}</span>
          </Link>
          <Link href="/cart" className={`relative flex items-center p-2 ${linkClass}`}>
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className={`absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none transform translate-x-1/4 -translate-y-1/4 rounded-full ${isHome ? "bg-white text-[#D3113D]" : "bg-black text-white"}`}>
                {itemCount}
              </span>
            )}
          </Link>
          <button 
            className={`md:hidden p-2 ${isHome ? "text-white" : "text-gray-600"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="flex flex-col p-4 gap-4 text-sm font-medium">
            <Link href="/products" onClick={() => setMobileMenuOpen(false)}>All Products</Link>
            <Link href="/products?category=apparel" onClick={() => setMobileMenuOpen(false)}>Apparel</Link>
            <Link href="/products?category=electronics" onClick={() => setMobileMenuOpen(false)}>Electronics</Link>
            <Link href="/products?collection=new-arrivals" onClick={() => setMobileMenuOpen(false)}>New Arrivals</Link>
            <Link href={session ? "/account" : "/login"} onClick={() => setMobileMenuOpen(false)} className="pt-4 border-t border-gray-100 flex items-center gap-2">
              <User className="h-5 w-5" />
              {session ? "Account" : "Sign In"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
