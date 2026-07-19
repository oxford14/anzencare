import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  ChevronRight,
  Lock,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { SignOutButton } from "@/components/account/sign-out-button";
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

      <Link
        href="/connect"
        className="mt-4 flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-colors active:bg-muted"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-mid">
          <Users className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Connect</p>
          <p className="text-xs text-muted-foreground">
            Invite others and earn referral commissions.
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>

      {profile?.role === "super_admin" && (
        <Link
          href="/super-admin/dashboard"
          className="mt-3 flex items-center gap-3 rounded-2xl border border-brand-mid/30 bg-brand-soft/60 p-4 transition-colors active:bg-brand-soft"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-mid text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-deep">
              Super Admin Console
            </p>
            <p className="text-xs text-muted-foreground">
              Members, withdrawals, commissions, and more.
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-brand-mid" />
        </Link>
      )}

      <div className="mt-5 space-y-3">
        <Link
          href="/account/profile"
          className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-colors active:bg-muted"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-mid">
            <UserRound className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Personal information
            </p>
            <p className="text-xs text-muted-foreground">
              Update your name and contact email.
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>

        <Link
          href="/account/security"
          className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-colors active:bg-muted"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-mid">
            <Lock className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Password &amp; security
            </p>
            <p className="text-xs text-muted-foreground">
              Change the password you use to sign in.
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      <div className="mt-5">
        <SignOutButton />
      </div>
    </div>
  );
}
