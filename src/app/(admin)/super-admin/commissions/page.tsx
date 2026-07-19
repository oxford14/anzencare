import type { Metadata } from "next";
import { Coins } from "lucide-react";

export const metadata: Metadata = {
  title: "Commissions",
};

export default function AdminCommissionsPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
        Commissions
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every commission earned, on every level, for each purchased coverage.
      </p>

      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-mid">
          <Coins className="size-6" />
        </div>
        <p className="mt-4 font-medium text-foreground">
          Commissions view coming soon
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          The commission engine (fixed amount per level) is being finalized.
          This page will list every commission for every purchased coverage,
          sorted by newest, with pagination.
        </p>
      </div>
    </div>
  );
}
