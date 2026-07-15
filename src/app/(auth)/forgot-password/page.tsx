import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-full flex-col overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,_#2a9d8f55_0%,_transparent_50%),linear-gradient(180deg,_#0b3d3a_0%,_#114f4a_32%,_#f4faf9_32%)]" />

      <div className="relative z-10 flex flex-1 flex-col px-6 pb-8 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <header className="animate-brand-fade mb-8 pt-6 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <ShieldCheck className="size-7 text-white" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-white">
            AnzenCare
          </h1>
          <p className="mt-2 text-sm text-white/80">Reset your password</p>
        </header>

        <div className="animate-form-slide mt-auto space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Forgot password
          </h2>
          <p className="text-sm text-muted-foreground">
            Password reset via email will be available once authentication is
            fully connected. Contact support if you need help accessing your
            account.
          </p>
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            Reset flow — coming soon
          </div>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 w-full rounded-xl text-base font-semibold"
            )}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
