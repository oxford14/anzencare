import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck, ShieldAlert } from "lucide-react";

import { AccountForm } from "@/components/account/account-form";
import { getMemberships, getProfile, getSessionUser } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const [user, profile, memberships] = await Promise.all([
    getSessionUser(),
    getProfile(),
    getMemberships(),
  ]);

  if (!user) {
    redirect("/login");
  }

  const hasActivePlan = memberships.some((m) => m.status === "active");
  const fullName = [profile?.first_name, profile?.middle_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <div className="px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Account
      </h1>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-brand-mid text-lg font-semibold text-white">
          {(profile?.first_name?.[0] ?? "A").toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {fullName || "Member"}
          </p>
          <div
            className={
              "mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
              (hasActivePlan
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700")
            }
          >
            {hasActivePlan ? (
              <>
                <BadgeCheck className="size-3.5" />
                KYC verified
              </>
            ) : (
              <>
                <ShieldAlert className="size-3.5" />
                Not yet activated
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <AccountForm
          userId={user.id}
          initial={{
            first_name: profile?.first_name ?? "",
            middle_name: profile?.middle_name ?? null,
            last_name: profile?.last_name ?? "",
            email: profile?.email ?? null,
            phone: profile?.phone ?? null,
          }}
        />
      </div>
    </div>
  );
}
