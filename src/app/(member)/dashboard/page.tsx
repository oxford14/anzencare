import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  IdCard,
  ShieldCheck,
  ShieldPlus,
  Wallet,
} from "lucide-react";

import {
  getActiveMembership,
  getProfile,
  getWallet,
} from "@/lib/queries";
import { formatDate, formatPeso } from "@/lib/format";

export const metadata: Metadata = {
  title: "Home",
};

export default async function DashboardPage() {
  const [profile, wallet, membership] = await Promise.all([
    getProfile(),
    getWallet(),
    getActiveMembership(),
  ]);

  const firstName = profile?.first_name?.trim() || "Member";
  const product = membership?.product;

  return (
    <div className="px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="mb-6">
        <p className="text-xs font-medium tracking-wide text-brand-mid uppercase">
          Welcome back
        </p>
        <h1 className="font-display mt-1 text-2xl font-semibold text-foreground">
          Hi, {firstName}
        </h1>
      </header>

      {membership && product ? (
        <section className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-deep via-brand-mid to-brand-glow p-5 text-white shadow-md">
          <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-white/10" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-white/75">Coverage</p>
              <p className="font-display mt-1 text-xl font-semibold">
                {product.name}
              </p>
              <p className="mt-3 text-sm text-white/85">
                Up to {formatPeso(product.coverage_amount)} ·{" "}
                {product.term_months} months
              </p>
            </div>
            <div className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold capitalize">
              {membership.status}
            </div>
          </div>
          <p className="mt-4 text-xs text-white/70">
            Expires {formatDate(membership.expiry_date)}
          </p>
        </section>
      ) : (
        <section className="mb-5 overflow-hidden rounded-2xl border border-dashed border-brand-mid/30 bg-brand-soft/60 p-5">
          <div className="flex items-center gap-2 text-brand-deep">
            <ShieldPlus className="size-5 text-brand-mid" />
            <p className="font-semibold">No active coverage yet</p>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Activate the Accident Protection plan for ₱500 and get covered up to
            ₱100,000.
          </p>
          <Link
            href="/insurances"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-brand-mid px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep active:scale-[0.98]"
          >
            Get protected
          </Link>
        </section>
      )}

      <section className="mb-6 grid grid-cols-3 gap-2">
        <SummaryTile
          icon={<Wallet className="size-4" />}
          label="Available"
          value={formatPeso(wallet?.available_balance ?? 0)}
        />
        <SummaryTile
          icon={<ShieldCheck className="size-4" />}
          label="Earned"
          value={formatPeso(wallet?.total_earnings ?? 0)}
        />
        <SummaryTile
          icon={<IdCard className="size-4" />}
          label="Withdrawn"
          value={formatPeso(wallet?.total_withdrawals ?? 0)}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <QuickLink href="/virtual-ids" title="My Virtual ID" />
        <QuickLink href="/insurances" title="Browse insurances" />
        <QuickLink href="/wallet" title="Wallet & withdrawals" />
        <QuickLink href="/account" title="Account & KYC" />
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
