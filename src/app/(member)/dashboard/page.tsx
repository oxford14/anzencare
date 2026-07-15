import type { Metadata } from "next";
import {
  ChevronRight,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
};

export default function DashboardPage() {
  return (
    <div className="px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="mb-6">
        <p className="text-xs font-medium tracking-wide text-brand-mid uppercase">
          Welcome back
        </p>
        <h1 className="font-display mt-1 text-2xl font-semibold text-foreground">
          Member Dashboard
        </h1>
      </header>

      <section className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-deep via-brand-mid to-brand-glow p-5 text-white shadow-md">
        <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-white/10" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-white/75">Coverage</p>
            <p className="mt-1 font-display text-xl font-semibold">
              Accident Protection
            </p>
            <p className="mt-3 text-sm text-white/85">
              Up to ₱100,000 · 6 months
            </p>
          </div>
          <div className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
            Active
          </div>
        </div>
        <p className="mt-4 text-xs text-white/70">Expires — · —</p>
      </section>

      <section className="mb-5 grid grid-cols-3 gap-2">
        <SummaryTile
          icon={<Wallet className="size-4" />}
          label="Available"
          value="₱0"
        />
        <SummaryTile
          icon={<ShieldCheck className="size-4" />}
          label="Earned"
          value="₱0"
        />
        <SummaryTile
          icon={<Users className="size-4" />}
          label="Direct"
          value="0"
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <QuickLink href="/card" title="Digital Insurance Card" />
        <QuickLink href="/referrals" title="Referral Link & Tree" />
        <QuickLink href="/wallet" title="Wallet & Withdrawals" />
        <QuickLink href="/claims" title="Submit a Claim" />
      </section>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card px-2.5 py-3 text-center">
      <div className="mx-auto mb-1.5 flex size-7 items-center justify-center rounded-full bg-brand-soft text-brand-mid">
        {icon}
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function QuickLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3.5 transition-colors active:bg-muted"
    >
      <span className="text-sm font-medium text-foreground">{title}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
