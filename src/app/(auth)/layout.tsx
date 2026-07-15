import type { Viewport } from "next";

import { PhoneShell } from "@/components/layout/phone-shell";

/** Sign-in and other auth screens: phone frame, not zoomable. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1e4a9e",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PhoneShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </PhoneShell>
  );
}
