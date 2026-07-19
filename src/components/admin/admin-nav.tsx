"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  ClipboardCheck,
  Coins,
  LayoutDashboard,
  Users,
  Share2,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/members", label: "Members", icon: Users },
  {
    href: "/super-admin/subscriptions",
    label: "Subscriptions",
    icon: ClipboardCheck,
  },
  { href: "/super-admin/withdrawals", label: "Withdrawals", icon: Banknote },
  { href: "/super-admin/referrals", label: "Referrals", icon: Share2 },
  { href: "/super-admin/commissions", label: "Commissions", icon: Coins },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
}

/** Vertical sidebar navigation (desktop). */
export function AdminNav() {
  const isActive = useActive();

  return (
    <nav className="px-3">
      <ul className="space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-mid text-white shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Fixed bottom navigation (mobile). */
export function AdminBottomNav() {
  const isActive = useActive();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/95 backdrop-blur-md lg:hidden">
      <ul className="flex items-stretch pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-brand-mid" : "text-muted-foreground"
                )}
              >
                <Icon
                  className="size-5"
                  strokeWidth={active ? 2.5 : 1.75}
                />
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
