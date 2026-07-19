import type { Metadata } from "next";
import { Banknote, ShieldCheck, Users, Wallet } from "lucide-react";

import { getAdminStats } from "@/lib/queries";
import { formatPeso } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const cards = [
    {
      label: "Total members",
      value: stats.members.toLocaleString("en-PH"),
      icon: Users,
    },
    {
      label: "Active coverages",
      value: stats.activeCoverages.toLocaleString("en-PH"),
      icon: ShieldCheck,
    },
    {
      label: "Pending withdrawals",
      value: stats.pendingWithdrawals.toLocaleString("en-PH"),
      icon: Banknote,
    },
    {
      label: "Total wallet balance",
      value: formatPeso(stats.totalWalletBalance),
      icon: Wallet,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
        Overview
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Key numbers across the platform.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-border/70 bg-card p-4"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-brand-mid">
              <Icon className="size-4" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-xl font-semibold text-foreground sm:text-2xl">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
