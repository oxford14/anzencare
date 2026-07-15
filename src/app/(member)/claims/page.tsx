import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Claims",
};

export default function ClaimsPage() {
  return (
    <div className="px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-mid"
      >
        <ChevronLeft className="size-4" />
        Back
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Claims
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Submit accident cash assistance claims and track status.
      </p>
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-16 text-center text-sm text-muted-foreground">
        Claim submission — coming soon
      </div>
    </div>
  );
}
