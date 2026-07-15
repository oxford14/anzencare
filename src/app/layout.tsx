import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AnzenCare",
    template: "%s · AnzenCare",
  },
  description:
    "Affordable Protection, Delivered Digitally. Because We Care.",
  applicationName: "AnzenCare",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AnzenCare",
  },
  formatDetection: {
    telephone: false,
  },
};

/** Landing page: normal responsive viewport (zoom allowed). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e4a9e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${fraunces.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
