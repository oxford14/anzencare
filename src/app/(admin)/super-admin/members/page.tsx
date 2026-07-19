import type { Metadata } from "next";

import { Pagination } from "@/components/admin/pagination";
import { MemberActions } from "@/components/admin/member-actions";
import { getAdminMembers } from "@/lib/queries";
import { formatDate, formatPhoneDisplay } from "@/lib/format";

export const metadata: Metadata = {
  title: "Members",
};

function fullName(first?: string | null, middle?: string | null, last?: string | null) {
  return [first, middle, last].filter(Boolean).join(" ").trim() || "—";
}

function roleBadge(role: string) {
  if (role === "super_admin") return "bg-brand-mid/15 text-brand-deep";
  return "bg-muted text-muted-foreground";
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const { rows, count, page: current, pageSize } = await getAdminMembers(
    Number(page) || 1
  );

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
        Members
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Newest registrations first.
      </p>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-12 text-center text-sm text-muted-foreground">
          No members yet.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="mt-5 space-y-2 md:hidden">
            {rows.map((m) => (
              <li
                key={m.id}
                className="rounded-2xl border border-border/70 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {fullName(m.first_name, m.middle_name, m.last_name)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatPhoneDisplay(m.phone)}
                    </p>
                    {m.email && (
                      <p className="truncate text-xs text-muted-foreground">
                        {m.email}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize " +
                        roleBadge(m.role)
                      }
                    >
                      {m.role.replace("_", " ")}
                    </span>
                    <MemberActions
                      member={{
                        id: m.id,
                        name: fullName(m.first_name, m.middle_name, m.last_name),
                        email: m.email,
                        phone: m.phone,
                        role: m.role,
                      }}
                    />
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Joined {formatDate(m.created_at)}
                </p>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-border/70 md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {rows.map((m) => (
                  <tr key={m.id} className="bg-card">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {fullName(m.first_name, m.middle_name, m.last_name)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatPhoneDisplay(m.phone)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize " +
                          roleBadge(m.role)
                        }
                      >
                        {m.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MemberActions
                        member={{
                          id: m.id,
                          name: fullName(
                            m.first_name,
                            m.middle_name,
                            m.last_name
                          ),
                          email: m.email,
                          phone: m.phone,
                          role: m.role,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            basePath="/super-admin/members"
            page={current}
            pageSize={pageSize}
            total={count}
          />
        </>
      )}
    </div>
  );
}
