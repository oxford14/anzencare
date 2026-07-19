import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, TrendingUp, Users } from "lucide-react";

import { InviteCard } from "@/components/connect/invite-card";
import {
  getConnectSummary,
  getReferralCommissions,
  getReferralLevels,
} from "@/lib/queries";
import { formatDate, formatPeso } from "@/lib/format";

export const metadata: Metadata = {
  title: "Connect",
};

export default async function ConnectPage() {
  const [summary, levels, commissions] = await Promise.all([
    getConnectSummary(),
    getReferralLevels(),
    getReferralCommissions(),
  ]);

  if (!summary) {
    redirect("/login");
  }

  const totalPerMember = levels.reduce((sum, l) => sum + Number(l.amount), 0);

  return (
    <div className="px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <Link
        href="/account"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-mid"
      >
        <ChevronLeft className="size-4" />
        Account
      </Link>

      <h1 className="font-display text-2xl font-semibold text-foreground">
        Connect
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Invite others and earn commissions up to 5 levels deep whenever they
        activate a plan.
      </p>

      <div className="mt-5">
        {summary.referralCode ? (
          <InviteCard referralCode={summary.referralCode} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-brand-soft/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Your referral code is being generated. Please check back shortly.
          </div>
        )}
      </div>

      <section className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex size-8 items-center justify-center rounded-full bg-brand-soft text-brand-mid">
            <TrendingUp className="size-4" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Total earned</p>
          <p className="mt-0.5 text-lg font-semibold text-foreground">
            {formatPeso(summary.totalEarnings)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex size-8 items-center justify-center rounded-full bg-brand-soft text-brand-mid">
            <Users className="size-4" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Connections</p>
          <p className="mt-0.5 text-lg font-semibold text-foreground">
            {summary.connections.length}
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Earnings per level
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <ul className="divide-y divide-border/70">
            {levels.map((lvl) => (
              <li
                key={lvl.level}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-deep">
                    {lvl.level}
                  </span>
                  <span className="text-sm text-foreground">
                    Level {lvl.level}
                  </span>
                </div>
                <span className="text-sm font-semibold text-brand-mid">
                  {formatPeso(lvl.amount)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between bg-brand-soft/60 px-4 py-3">
            <span className="text-sm font-semibold text-brand-deep">
              Total per activated plan
            </span>
            <span className="text-sm font-bold text-brand-deep">
              {formatPeso(totalPerMember)}
            </span>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border/70">
          <Image
            src="/referral-tiers-income.png"
            alt="Referral earnings breakdown by level"
            width={683}
            height={1024}
            className="h-auto w-full"
          />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Your connections
        </h2>
        {summary.connections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-10 text-center text-sm text-muted-foreground">
            No connections yet. Share your code to start earning.
          </div>
        ) : (
          <ul className="space-y-2">
            {summary.connections.map((c) => {
              const name = [c.first_name, c.last_name]
                .filter(Boolean)
                .join(" ")
                .trim();
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-mid text-sm font-semibold text-white">
                    {(c.first_name?.[0] ?? "M").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {name || "Member"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(c.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Commission history
        </h2>
        {commissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-10 text-center text-sm text-muted-foreground">
            Commissions appear here when your connections activate a plan.
          </div>
        ) : (
          <ul className="space-y-2">
            {commissions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Level {tx.level} commission
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tx.created_at)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-brand-mid">
                  +{formatPeso(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
