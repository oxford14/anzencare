"use client";

import { useEffect, useState } from "react";
import { ChevronRight, X } from "lucide-react";

import { PhotoViewer } from "@/components/admin/photo-viewer";
import { SubscriptionActions } from "@/components/admin/subscription-actions";
import { formatDate, formatPeso, formatPhoneDisplay } from "@/lib/format";
import { cn } from "@/lib/utils";

export type SubscriptionItem = {
  id: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  amount: number | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  sex: string | null;
  civil_status: string | null;
  nationality: string | null;
  occupation: string | null;
  mobile: string | null;
  email: string | null;
  gov_id_type: string | null;
  gov_id_number: string | null;
  address_line: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  beneficiary_full_name: string | null;
  beneficiary_relationship: string | null;
  beneficiary_mobile: string | null;
  productName: string | null;
  productPrice: number | null;
  memberFirstName: string | null;
  memberLastName: string | null;
  memberPhone: string | null;
  govIdUrl: string | null;
  selfieUrl: string | null;
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Active",
  rejected: "Denied",
};

function fullName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ").trim();
}

function memberName(item: SubscriptionItem) {
  return (
    fullName(item.memberFirstName, item.memberLastName) ||
    formatPhoneDisplay(item.memberPhone) ||
    "Member"
  );
}

export function SubscriptionList({ items }: { items: SubscriptionItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = items.find((i) => i.id === activeId) ?? null;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  return (
    <>
      <ul className="mt-5 divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card">
        {items.map((item) => (
          <li key={item.id}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-foreground">
                    {memberName(item)}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      statusStyles[item.status] ??
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    {statusLabels[item.status] ?? item.status}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {item.productName ?? "Plan"}
                  {" · "}
                  {formatPeso(item.amount ?? item.productPrice ?? 0)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveId(item.id)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                View
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in"
            onClick={() => setActiveId(null)}
          />
          <div className="relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-card shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200 sm:max-w-lg sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-semibold text-foreground">
                    {memberName(active)}
                  </h2>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      statusStyles[active.status] ??
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    {statusLabels[active.status] ?? active.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {active.productName ?? "Plan"}
                  {" · "}
                  {formatPeso(active.amount ?? active.productPrice ?? 0)}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Submitted{" "}
                  {formatDate(active.created_at, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {active.status === "pending" ? (
                <div className="mb-4">
                  <SubscriptionActions
                    applicationId={active.id}
                    status={active.status}
                  />
                </div>
              ) : (
                (active.reviewed_at || active.review_notes) && (
                  <div className="mb-4 rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                    {active.reviewed_at && (
                      <p>Reviewed {formatDate(active.reviewed_at)}</p>
                    )}
                    {active.status === "rejected" && active.review_notes && (
                      <p className="mt-0.5 text-destructive">
                        {active.review_notes}
                      </p>
                    )}
                  </div>
                )
              )}

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Detail
                  label="Subscriber"
                  value={fullName(active.first_name, active.last_name)}
                />
                <Detail label="Date of birth" value={active.date_of_birth} />
                <Detail label="Sex" value={active.sex} />
                <Detail label="Civil status" value={active.civil_status} />
                <Detail label="Nationality" value={active.nationality} />
                <Detail label="Occupation" value={active.occupation} />
                <Detail label="Mobile" value={active.mobile} />
                <Detail label="Email" value={active.email} />
                <Detail
                  label="Government ID"
                  value={
                    active.gov_id_type
                      ? `${active.gov_id_type}${
                          active.gov_id_number
                            ? ` · ${active.gov_id_number}`
                            : ""
                        }`
                      : active.gov_id_number
                  }
                  className="col-span-2"
                />
                <Detail
                  label="Address"
                  value={
                    [
                      active.address_line,
                      active.barangay,
                      active.city,
                      active.province,
                      active.postal_code,
                    ]
                      .filter(Boolean)
                      .join(", ") || null
                  }
                  className="col-span-2"
                />
                <Detail
                  label="Beneficiary"
                  value={active.beneficiary_full_name}
                />
                <Detail
                  label="Relationship"
                  value={active.beneficiary_relationship}
                />
                <Detail
                  label="Beneficiary mobile"
                  value={active.beneficiary_mobile}
                />
              </dl>

              <div className="mt-5 border-t border-border/60 pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  KYC documents
                </p>
                <PhotoViewer
                  photos={[
                    { label: "Government ID", url: active.govIdUrl },
                    { label: "Selfie", url: active.selfieUrl },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
