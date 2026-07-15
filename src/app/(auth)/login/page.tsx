import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_#c5d4f5_0%,_transparent_50%),linear-gradient(180deg,_#eef2fb_0%,_#f7f9fc_45%,_#ffffff_100%)]" />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-[max(2rem,env(safe-area-inset-top))] text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#1e4a9e] uppercase">
          AnzenCare
        </p>
        <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-[#14264f]">
          Coming soon
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#3a4a6b]">
          Sign in is not available yet. We&apos;ll open member access shortly.
        </p>
        <Link
          href="/"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 h-12 w-full max-w-xs rounded-xl bg-[#1e4a9e] text-base font-semibold text-white hover:bg-[#163a7d]"
          )}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
