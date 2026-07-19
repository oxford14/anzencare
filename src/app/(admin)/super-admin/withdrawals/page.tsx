import type { Metadata } from "next";

import { Pagination } from "@/components/admin/pagination";
import { WithdrawalActions } from "@/components/admin/withdrawal-actions";
import { getAdminWithdrawals } from "@/lib/queries";
import { formatDate, formatPeso, formatPhoneDisplay } from "@/lib/format";

export const metadata: Metadata = {
  title: "Withdrawals",
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

type Snapshot = {
  account_type?: string;
  bank_name?: string | null;
  account_number?: string;
  account_name?: string;
};

function payoutLine(snapshot: unknown) {
  const s = (snapshot ?? {}) as Snapshot;
  if (!s.account_type) return "—";
  const bank = s.bank_name ? ` (${s.bank_name})` : "";
  return `${s.account_type}${bank} · ${s.account_number ?? ""}`;
}

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const { rows, count, page: current, pageSize } = await getAdminWithdrawals(
    Number(page) || 1
  );

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
        Withdrawals
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Newest requests first. Reject refunds the wallet automatically.
      </p>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-12 text-center text-sm text-muted-foreground">
          No withdrawal requests yet.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="mt-5 space-y-2 lg:hidden">
            {rows.map((r) => {
              const name =
                [r.profile?.first_name, r.profile?.last_name]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || formatPhoneDisplay(r.profile?.phone) || "Member";
              return (
                <li
                  key={r.id}
                  className="rounded-2xl border border-border/70 bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {payoutLine(r.account_snapshot)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-foreground">
                        {formatPeso(r.amount)}
                      </p>
                      <span
                        className={
                          "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize " +
                          (statusStyles[r.status] ??
                            "bg-muted text-muted-foreground")
                        }
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {formatDate(r.created_at, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="mt-3">
                    <WithdrawalActions requestId={r.id} status={r.status} />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop table */}
          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-border/70 lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Payout to</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Requested</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {rows.map((r) => {
                  const name =
                    [r.profile?.first_name, r.profile?.last_name]
                      .filter(Boolean)
                      .join(" ")
                      .trim() || "Member";
                  return (
                    <tr key={r.id} className="bg-card align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPhoneDisplay(r.profile?.phone)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {payoutLine(r.account_snapshot)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {formatPeso(r.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize " +
                            (statusStyles[r.status] ??
                              "bg-muted text-muted-foreground")
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(r.created_at, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <WithdrawalActions requestId={r.id} status={r.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            basePath="/super-admin/withdrawals"
            page={current}
            pageSize={pageSize}
            total={count}
          />
        </>
      )}
    </div>
  );
}
