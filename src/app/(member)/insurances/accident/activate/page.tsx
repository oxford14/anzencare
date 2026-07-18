import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ActivationForm } from "@/components/insurances/activation-form";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <Link
        href="/insurances"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-mid"
      >
        <ChevronLeft className="size-4" />
        Back
      </Link>
      <h1 className="font-display mb-1 text-2xl font-semibold text-foreground">
        Activate plan
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Add your beneficiary and complete KYC to activate coverage.
      </p>

      <ActivationForm
        price={Number(product.price)}
        coverageAmount={Number(product.coverage_amount)}
        termMonths={product.term_months}
      />
    </div>
  );
}
