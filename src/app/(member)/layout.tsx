import type { Viewport } from "next";

import { BottomNav } from "@/components/layout/bottom-nav";
import { PhoneShell } from "@/components/layout/phone-shell";

/** Member app: phone frame, not zoomable. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1e4a9e",
};

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PhoneShell>
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        <BottomNav />
      </div>
    </PhoneShell>
  );
}
