"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IdCard,
  LayoutGrid,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/insurances", label: "Insure", icon: ShieldCheck },
  { href: "/virtual-ids", label: "Virtual ID", icon: IdCard },
  { href: "/account", label: "Account", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 border-t border-border/80 bg-card/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md">
      <ul className="grid grid-cols-5 gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors",
                  active
                    ? "bg-brand-soft text-brand-deep"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    active ? "text-brand-mid" : "text-muted-foreground"
                  )}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
