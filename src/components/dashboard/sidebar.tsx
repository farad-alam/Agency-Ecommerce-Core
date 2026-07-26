"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Layers,
  BarChart2,
  Settings,
  Image,
  Truck,
  MessageSquare,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Categories", href: "/dashboard/categories", icon: Layers },
  { label: "Brands", href: "/dashboard/brands", icon: Tag },
  { label: "Collections", href: "/dashboard/collections", icon: Layers },
  { label: "Coupons", href: "/dashboard/coupons", icon: Percent },
  { label: "Shipping", href: "/dashboard/shipping", icon: Truck },
  { label: "Reviews", href: "/dashboard/reviews", icon: MessageSquare },
  { label: "Media", href: "/dashboard/media", icon: Image },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2, adminOnly: true },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, adminOnly: true },
];

interface Props {
  role: string;
}

export function DashboardSidebar({ role }: Props) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter(
    (item) => !item.adminOnly || role === "ADMIN"
  );

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-white/[0.06] bg-[#0d0d10]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
          <Package className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white">Core Dashboard</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-indigo-400" : "")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Role badge */}
      <div className="border-t border-white/[0.06] px-5 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            role === "ADMIN"
              ? "bg-indigo-500/20 text-indigo-300"
              : "bg-zinc-700 text-zinc-400"
          )}
        >
          {role}
        </span>
      </div>
    </aside>
  );
}
