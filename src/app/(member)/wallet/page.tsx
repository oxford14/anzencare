import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallet",
};

export default function WalletPage() {
  return (
    <div className="px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Wallet
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Referral earnings and withdrawals (min ₱300).
      </p>
      <div className="mt-6 grid gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-brand-deep to-brand-mid p-5 text-white">
          <p className="text-xs text-white/75">Available balance</p>
          <p className="mt-1 font-display text-3xl font-semibold">₱0.00</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <p className="text-xs text-muted-foreground">Total earned</p>
            <p className="mt-1 text-lg font-semibold">₱0</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <p className="text-xs text-muted-foreground">Withdrawn</p>
            <p className="mt-1 text-lg font-semibold">₱0</p>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-10 text-center text-sm text-muted-foreground">
          Ledger & withdraw — coming soon
        </div>
      </div>
    </div>
  );
}
