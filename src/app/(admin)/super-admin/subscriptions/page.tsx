import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { Pagination } from "@/components/admin/pagination";
import {
  SubscriptionList,
  type SubscriptionItem,
} from "@/components/admin/subscription-list";
import { getAdminApplications } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Subscriptions",
};

const SIGNED_URL_TTL = 60 * 10; // 10 minutes

const FILTERS = [
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Active Subscription" },
  { value: "rejected", label: "Denied" },
  { value: "all", label: "All" },
] as const;

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  const { page, status: statusParam, q: qParam } = await searchParams;
  const status =
    FILTERS.some((f) => f.value === statusParam) && statusParam
      ? statusParam
      : "pending";
  const q = qParam ?? "";

  const { rows, count, page: current, pageSize } = await getAdminApplications(
    Number(page) || 1,
    { status, q }
  );

  const supabase = await createClient();

  // Generate short-lived signed URLs for the private KYC images.
  const items: SubscriptionItem[] = await Promise.all(
    rows.map(async (r) => {
      const paths = [r.gov_id_path, r.selfie_path].filter(
        (p): p is string => Boolean(p)
      );
      const urlByPath = new Map<string, string>();
      if (paths.length > 0) {
        const { data } = await supabase.storage
          .from("kyc")
          .createSignedUrls(paths, SIGNED_URL_TTL);
        for (const item of data ?? []) {
          if (item.path && item.signedUrl) {
            urlByPath.set(item.path, item.signedUrl);
          }
        }
      }
      return {
        id: r.id,
        status: r.status,
        created_at: r.created_at,
        reviewed_at: r.reviewed_at,
        review_notes: r.review_notes,
        amount: r.amount,
        first_name: r.first_name,
        last_name: r.last_name,
        date_of_birth: r.date_of_birth,
        sex: r.sex,
        civil_status: r.civil_status,
        nationality: r.nationality,
        occupation: r.occupation,
        mobile: r.mobile,
        email: r.email,
        gov_id_type: r.gov_id_type,
        gov_id_number: r.gov_id_number,
        address_line: r.address_line,
        barangay: r.barangay,
        city: r.city,
        province: r.province,
        postal_code: r.postal_code,
        beneficiary_full_name: r.beneficiary_full_name,
        beneficiary_relationship: r.beneficiary_relationship,
        beneficiary_mobile: r.beneficiary_mobile,
        productName: r.product?.name ?? null,
        productPrice: r.product?.price ?? null,
        memberFirstName: r.profile?.first_name ?? null,
        memberLastName: r.profile?.last_name ?? null,
        memberPhone: r.profile?.phone ?? null,
        govIdUrl: r.gov_id_path ? urlByPath.get(r.gov_id_path) ?? null : null,
        selfieUrl: r.selfie_path ? urlByPath.get(r.selfie_path) ?? null : null,
      };
    })
  );

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
        Subscriptions
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Approving issues the membership and digital ID and pays referral
        commissions automatically. Denying refunds the plan price to the
        member&apos;s wallet.
      </p>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.value === status;
          const params = new URLSearchParams();
          params.set("status", f.value);
          if (q) params.set("q", q);
          return (
            <Link
              key={f.value}
              href={`/super-admin/subscriptions?${params.toString()}`}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-brand-mid text-white"
                  : "border border-border/70 bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Search */}
      <form
        action="/super-admin/subscriptions"
        method="get"
        className="mt-3 flex gap-2"
      >
        <input type="hidden" name="status" value={status} />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name, email, or mobile"
            className="h-10 w-full rounded-xl border border-border/70 bg-card pl-9 pr-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-xl bg-brand-mid px-4 text-sm font-medium text-white transition-colors hover:bg-brand-deep"
        >
          Search
        </button>
      </form>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-12 text-center text-sm text-muted-foreground">
          {q
            ? "No subscriptions match your search."
            : "No subscriptions in this view."}
        </div>
      ) : (
        <>
          <SubscriptionList items={items} />

          <Pagination
            basePath="/super-admin/subscriptions"
            page={current}
            pageSize={pageSize}
            total={count}
            extraParams={{ status, q: q || undefined }}
          />
        </>
      )}
    </div>
  );
}
