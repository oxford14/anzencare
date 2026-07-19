import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { AdminBottomNav, AdminNav } from "@/components/admin/admin-nav";
import { getSessionUser, isSuperAdmin } from "@/lib/queries";

export const metadata: Metadata = {
  title: {
    default: "Super Admin",
    template: "%s · Super Admin",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14264f",
};

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const allowed = await isSuperAdmin();
  if (!allowed) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border/70 bg-card lg:flex">
        <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-mid text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="font-display text-base font-semibold leading-tight text-foreground">
              Super Admin
            </p>
            <p className="text-[11px] text-muted-foreground">
              AnzenCare console
            </p>
          </div>
        </div>

        <div className="mt-2">
          <AdminNav />
        </div>

        <div className="mt-auto p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
            Back to app
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 border-b border-border/70 bg-card/95 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-mid text-white">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-tight text-foreground">
                Super Admin
              </p>
              <p className="text-[11px] text-muted-foreground">
                AnzenCare console
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to app</span>
          </Link>
        </div>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 pb-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] pt-5 lg:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <AdminBottomNav />
    </div>
  );
}
