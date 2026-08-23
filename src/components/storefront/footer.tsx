"use client";

import Link from "next/link";
import { FadeIn } from "@/components/animations/fade-in";
import { motion } from "framer-motion";
const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Blogs", href: "/blogs" },
  { label: "Contact Us", href: "/contact" },
];

const LEGAL_LINKS = [
  { label: "Terms Of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const MediumIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-current" aria-hidden="true">
    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42c1.87 0 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
  </svg>
);

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-[#0B0B0B] via-[#5A0811] to-[#ff1e32] pt-24 overflow-hidden">
      
      {/* Top Border with Star */}
      <div className="relative max-w-6xl mx-auto px-4 lg:px-8 mb-24 flex items-center justify-center">
        <div className="absolute left-0 right-0 h-[1px] bg-[#2A2A2A] top-1/2 -translate-y-1/2" />
        <span className="relative z-10 bg-[#0B0B0B] px-5 text-[#F5F2ED]/40 text-2xl font-light mt-1 flex items-center justify-center">
          *
        </span>
      </div>

      <div className="mx-auto max-w-6xl px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-8 mb-16">
           {/* Col 1 */}
           <FadeIn delay={0} direction="up">
             <div>
                <h4 className="text-[#F5F2ED]/60 font-body text-[15px] mb-6">Quick Links</h4>
                <ul className="space-y-4">
                   {QUICK_LINKS.map(l => (
                     <li key={l.label}>
                       <Link href={l.href} className="text-[#F5F2ED] hover:text-white text-[15px] font-body transition-colors">{l.label}</Link>
                     </li>
                   ))}
                </ul>
             </div>
           </FadeIn>
           
           {/* Col 2 */}
           <FadeIn delay={0.1} direction="up">
             <div>
                <h4 className="text-[#F5F2ED]/60 font-body text-[15px] mb-6">Legal Links</h4>
                <ul className="space-y-4">
                   {LEGAL_LINKS.map(l => (
                     <li key={l.label}>
                       <Link href={l.href} className="text-[#F5F2ED] hover:text-white text-[15px] font-body transition-colors">{l.label}</Link>
                     </li>
                   ))}
                </ul>
             </div>
           </FadeIn>

           {/* Col 3 */}
           <FadeIn delay={0.2} direction="up">
             <div>
                <h4 className="text-[#F5F2ED]/60 font-body text-[15px] mb-6">Stay Connect</h4>
                <div className="flex items-center gap-6">
                   <a href="#" className="text-[#F5F2ED] hover:text-white transition-colors"><XIcon /></a>
                   <a href="#" className="text-[#F5F2ED] hover:text-white transition-colors"><InstagramIcon /></a>
                   <a href="#" className="text-[#F5F2ED] hover:text-white transition-colors"><MediumIcon /></a>
                </div>
             </div>
           </FadeIn>

           {/* Col 4 */}
           <FadeIn delay={0.3} direction="up" className="col-span-2 md:col-span-1">
             <div>
                <h4 className="text-[#F5F2ED]/60 font-body text-[15px] mb-6">Newsletter</h4>
                <h3 className="text-[#F5F2ED] text-xl md:text-[22px] font-semibold font-body mb-6 leading-snug">
                  You Read This Far, Might As Well Sign Up.
                </h3>
                <form className="flex gap-2">
                   <input 
                     type="email" 
                     placeholder="sample@gmail.com" 
                     className="bg-[#000000]/20 border border-transparent text-[#F5F2ED] placeholder:text-[#F5F2ED]/40 px-4 py-3 rounded-lg outline-none focus:border-[#F5F2ED]/30 flex-1 font-body text-[14px] transition-colors"
                   />
                   <button type="submit" className="bg-[#ffffff]/15 hover:bg-[#ffffff]/25 text-[#F5F2ED] px-6 py-3 rounded-lg font-body text-[14px] font-medium transition-colors border border-transparent">
                     Submit
                   </button>
                </form>
             </div>
           </FadeIn>
        </div>
      </div>

      {/* Giant Typography at the bottom */}
      <motion.div 
        className="w-full flex justify-center items-end mt-16 relative z-0 leading-none overflow-hidden select-none pointer-events-none"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
      >
        <motion.h1 
          variants={{
            hidden: { y: "100%" },
            visible: { y: 0 }
          }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ 
            fontFamily: "'Montserrat', Arial, sans-serif",
            fontSize: "25vw",
            fontWeight: 800,
            lineHeight: 0.72,
            color: "#FFE5B4", /* Pale warm yellow/cream blending into the red */
            opacity: 0.9,
            letterSpacing: "-0.03em"
          }}
        >
          SalarX
        </motion.h1>
      </motion.div>
    </footer>
  );
}
