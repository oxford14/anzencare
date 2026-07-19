import type { Metadata } from "next";
import { Share2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Referrals",
};

export default function AdminReferralsPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
        Referrals
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Connections between members across every level.
      </p>

      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-mid">
          <Share2 className="size-6" />
        </div>
        <p className="mt-4 font-medium text-foreground">
          Referrals view coming soon
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          The referral network is being finalized. This page will list each
          member&apos;s referrals across every level, sorted by newest, with
          pagination.
        </p>
      </div>
    </div>
  );
}
