import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "The Falls at Lions Den",
  description:
    "Guest hub for The Falls at Lions Den. Cabins, lakes, trails, firepits, and more in Imperial, MO.",
  applicationName: "Falls at Lions Den",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Falls",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0a08",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#0e0a08] text-[#F0E2C2]"><RegisterSW />{children}</body>
    </html>
  );
}
