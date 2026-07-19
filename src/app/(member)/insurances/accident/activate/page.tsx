import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Clock, ShieldAlert } from "lucide-react";

import { ActivationForm } from "@/components/insurances/activation-form";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Activate Accident Protection",
};

export default async function ActivateAccidentPage() {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("insurance_products")
    .select("*")
    .eq("slug", "accident")
    .maybeSingle();

  if (!product) {
    redirect("/insurances");
  }

  // If already active, send to the virtual ID instead.
  const { data: existing } = await supabase
    .from("memberships")
    .select("id")
    .eq("product_id", product.id)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    redirect("/virtual-ids");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("first_name, middle_name, last_name, email, phone")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: wallet } = user
    ? await supabase
        .from("wallets")
        .select("available_balance")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  // Latest application for this product decides what to show.
  const { data: latestApp } = user
    ? await supabase
        .from("insurance_applications")
        .select("id, status, review_notes, created_at")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const pending = latestApp?.status === "pending";
  const rejected = latestApp?.status === "rejected";

  return (
    <div className="px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <Link
        href="/insurances"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-mid"
      >
        <ChevronLeft className="size-4" />
        Back
      </Link>

      {pending ? (
        <>
          <h1 className="font-display mb-1 text-2xl font-semibold text-foreground">
            Application under review
          </h1>
          <p className="mb-5 text-sm text-muted-foreground">
            We&apos;ve received your activation request.
          </p>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-2 text-amber-700">
              <Clock className="size-5" />
              <p className="font-semibold">Pending admin review</p>
            </div>
            <p className="mt-2 text-sm text-amber-800/90">
              Our team is reviewing your details and KYC documents. You&apos;ll
              get your coverage and digital ID once it&apos;s approved. This
              usually takes a little while.
            </p>
            <p className="mt-3 text-xs text-amber-800/70">
              Submitted {formatDate(latestApp?.created_at)}
            </p>
          </section>

          <Link
            href="/dashboard"
            className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-brand-mid text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
          >
            Back to home
          </Link>
        </>
      ) : (
        <>
          <h1 className="font-display mb-1 text-2xl font-semibold text-foreground">
            Activate plan
          </h1>
          <p className="mb-5 text-sm text-muted-foreground">
            Add your details and complete KYC. Your application will be reviewed
            before coverage is activated.
          </p>

          {rejected && (
            <section className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="size-5" />
                <p className="font-semibold">Previous application declined</p>
              </div>
              <p className="mt-1.5 text-sm text-destructive/90">
                {latestApp?.review_notes?.trim()
                  ? latestApp.review_notes
                  : "Your last application was not approved. Please review your details and try again."}
              </p>
            </section>
          )}

          <ActivationForm
            price={Number(product.price)}
            coverageAmount={Number(product.coverage_amount)}
            termMonths={product.term_months}
            productId={product.id}
            balance={Number(wallet?.available_balance ?? 0)}
            initial={{
              first_name: profile?.first_name ?? "",
              middle_name: profile?.middle_name ?? null,
              last_name: profile?.last_name ?? "",
              email: profile?.email ?? null,
              phone: profile?.phone ?? null,
            }}
          />
        </>
      )}
    </div>
  );
}
