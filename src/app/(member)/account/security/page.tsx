import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { PasswordForm } from "@/components/account/password-form";
import { getSessionUser } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Password & security",
};

export default async function SecurityPage() {
  const user = await getSessionUser();

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
        Password &amp; security
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose a strong password you don&apos;t use anywhere else.
      </p>

      <div className="mt-5">
        <PasswordForm />
      </div>
    </div>
  );
}
