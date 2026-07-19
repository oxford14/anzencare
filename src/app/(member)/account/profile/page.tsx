import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ProfileForm } from "@/components/account/profile-form";
import { getProfile, getSessionUser } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Personal information",
};

export default async function ProfilePage() {
  const [user, profile] = await Promise.all([getSessionUser(), getProfile()]);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <Link
        href="/account"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-mid"
      >
        <ChevronLeft className="size-4" />
        Account
      </Link>

      <h1 className="font-display text-2xl font-semibold text-foreground">
        Personal information
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update your name and contact email.
      </p>

      <div className="mt-5">
        <ProfileForm
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
