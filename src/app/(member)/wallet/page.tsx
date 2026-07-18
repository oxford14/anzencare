import type { Metadata } from "next";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
} from "lucide-react";

import { WithdrawForm } from "@/components/wallet/withdraw-form";
import { getWallet, getWalletTransactions } from "@/lib/queries";
import { formatDate, formatPeso } from "@/lib/format";

export const metadata: Metadata = {
  title: "Wallet",
};

const statusStyles: Record<string, string> = {
  completed: "bg-brand-soft text-brand-deep",
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function WalletPage() {
  const [wallet, transactions] = await Promise.all([
    getWallet(),
    getWalletTransactions(),
  ]);

  const available = Number(wallet?.available_balance ?? 0);

  return (
    <div className="px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Wallet
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Referral earnings and withdrawals.
      </p>

      <div className="mt-5 grid gap-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-deep to-brand-mid p-5 text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/10" />
          <p className="text-xs text-white/75">Available balance</p>
          <p className="font-display mt-1 text-3xl font-semibold">
            {formatPeso(available)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <p className="text-xs text-muted-foreground">Total earned</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatPeso(wallet?.total_earnings ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <p className="text-xs text-muted-foreground">Withdrawn</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatPeso(wallet?.total_withdrawals ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <WithdrawForm availableBalance={available} />
      </div>

      <section className="mt-7">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Transaction history
        </h2>
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-12 text-center text-sm text-muted-foreground">
            No transactions yet. Earnings from referrals will show up here.
          </div>
        ) : (
          <ul className="space-y-2">
            {transactions.map((tx) => {
              const isCredit = tx.type === "credit";
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3"
                >
                  <div
                    className={
                      "flex size-9 shrink-0 items-center justify-center rounded-full " +
                      (isCredit
                        ? "bg-brand-soft text-brand-mid"
                        : "bg-red-50 text-brand-red")
                    }
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {tx.description ||
                        (isCredit ? "Commission" : "Withdrawal")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        "text-sm font-semibold " +
                        (isCredit ? "text-brand-mid" : "text-foreground")
                      }
                    >
                      {isCredit ? "+" : "-"}
                      {formatPeso(tx.amount)}
                    </p>
                    <span
                      className={
                        "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize " +
                        (statusStyles[tx.status] ?? "bg-muted text-muted-foreground")
                      }
                    >
                      {tx.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-6 flex items-center gap-2 rounded-2xl bg-brand-soft/60 px-4 py-3 text-xs text-muted-foreground">
        <Banknote className="size-4 shrink-0 text-brand-mid" />
        Withdrawals are reviewed and paid out to GCash, Maya, or your bank.
      </div>
    </div>
  );
}
