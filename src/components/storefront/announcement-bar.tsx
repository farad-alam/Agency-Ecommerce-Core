"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const MESSAGES = [
  "🚚  Free Delivery on orders above ৳999  |  Cash on Delivery Available",
  "🆕  New Arrivals Just Dropped — Shop the Latest Collection",
  "💬  Order via WhatsApp: +8801700000000",
];

export function AnnouncementBar() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % MESSAGES.length);
        setFading(false);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="relative z-[60] flex items-center justify-center px-10"
      style={{ background: "#8B0D1A", minHeight: "40px" }}
    >
      <p
        className="text-center transition-opacity duration-300"
        style={{
          fontFamily: "'Montserrat', Arial, sans-serif",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#F5F2ED",
          opacity: fading ? 0 : 1,
        }}
      >
        {MESSAGES[current]}
      </p>
      <button
        onClick={() => setVisible(false)}
        aria-label="Close announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F5F2ED]/60 hover:text-[#F5F2ED] transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
