import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Falls at Lions Den — Map",
  description:
    "Guest map for The Falls at Lions Den. Cabins, lakes, trails, firepits, and more.",
  applicationName: "Falls at Lions Den",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Falls Map",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A1310",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#2A1F18] text-[#F0E2C2]">{children}</body>
    </html>
  );
}
