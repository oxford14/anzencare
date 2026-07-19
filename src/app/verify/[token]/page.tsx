import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Verify Member",
  robots: { index: false, follow: false },
};

const statusLabels: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  suspended: "Suspended",
};

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_virtual_id", {
    p_token: token,
  });

  const record = Array.isArray(data) ? data[0] : null;
  const valid = Boolean(record?.is_valid) && !error;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-brand-soft/50 to-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-mid text-white">
            <ShieldCheck className="size-6" />
          </div>
          <p className="mt-2 font-display text-lg font-semibold text-foreground">
            AnzenCare
          </p>
          <p className="text-xs text-muted-foreground">Member verification</p>
        </div>

        {!record ? (
          <div className="rounded-3xl border border-border/70 bg-card p-6 text-center shadow-sm">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <ShieldAlert className="size-7" />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-foreground">
              ID not found
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This QR code doesn&apos;t match any AnzenCare member. It may be
              invalid or has been revoked.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
            <div
              className={
                "flex flex-col items-center px-6 py-6 text-center text-white " +
                (valid
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                  : "bg-gradient-to-br from-amber-500 to-red-500")
              }
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
                {valid ? (
                  <BadgeCheck className="size-8" />
                ) : (
                  <ShieldAlert className="size-8" />
                )}
              </div>
              <h1 className="mt-3 text-lg font-semibold">
                {valid ? "Verified member" : "Not currently valid"}
              </h1>
              <p className="mt-0.5 text-sm text-white/85">
                {valid
                  ? "This is an active AnzenCare policy."
                  : `Coverage status: ${
                      statusLabels[record.status] ?? record.status
                    }`}
              </p>
            </div>

            <dl className="divide-y divide-border/70 px-6 py-2 text-sm">
              <Row label="Member" value={record.full_name || "Member"} />
              <Row label="Member ID" value={record.member_id} mono />
              <Row label="Plan" value={record.product_name || "AnzenCare Plan"} />
              <Row
                label="Status"
                value={statusLabels[record.status] ?? record.status}
              />
              <Row label="Issued" value={formatDate(record.issued_at)} />
              <Row
                label="Expires"
                value={
                  record.expiry_date ? formatDate(record.expiry_date) : "—"
                }
              />
            </dl>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Verified via{" "}
          <Link href="/" className="font-medium text-brand-mid">
            AnzenCare
          </Link>
        </p>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          "text-right font-medium text-foreground " +
          (mono ? "font-mono tracking-wider" : "")
        }
      >
        {value}
      </dd>
    </div>
  );
}
