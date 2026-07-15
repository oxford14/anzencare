import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referrals",
};

export default function ReferralsPage() {
  return (
    <div className="px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Referrals
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Share your link and earn up to 5 levels of commission.
      </p>
      <div className="mt-6 space-y-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-xs text-muted-foreground">Your referral code</p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wide text-brand-deep">
            ANZEN————
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-12 text-center text-sm text-muted-foreground">
          Referral tree & commission history — coming soon
        </div>
      </div>
    </div>
  );
}
