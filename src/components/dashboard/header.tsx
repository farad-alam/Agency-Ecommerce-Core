"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Props {
  user: { name?: string | null; email: string; role: string };
}

export function DashboardHeader({ user }: Props) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0d0d10] px-6">
      <div />

      <div className="flex items-center gap-3">
        {/* Notifications placeholder */}
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
          <Bell className="h-4 w-4" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 text-sm text-zinc-300 hover:text-zinc-100 rounded-md p-2 hover:bg-white/[0.04] transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden md:block">{user.name ?? user.email}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-white/[0.08] bg-[#18181b] text-zinc-200"
          >
            <DropdownMenuLabel className="text-zinc-400">
              <div className="text-xs">{user.email}</div>
              <div className="text-xs text-zinc-600">{user.role}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
