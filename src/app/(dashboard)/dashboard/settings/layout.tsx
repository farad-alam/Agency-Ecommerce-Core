"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: "General", href: "/dashboard/settings" },
    { name: "Payment Providers", href: "/dashboard/settings/payments" },
    { name: "Team Settings", href: "/dashboard/settings/team" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Store Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage global store configurations and teams.</p>
      </div>

      <div className="border-b border-white/[0.08]">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-zinc-400 hover:border-white/[0.2] hover:text-zinc-300"
                  }
                `}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-2">{children}</div>
    </div>
  );
}
