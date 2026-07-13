import type { Metadata, Viewport } from "next";
import { Cabin_Sketch, Caveat } from "next/font/google";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

// Self-hosted via next/font — replaces the render-blocking Google Fonts
// @import chain in globals.css. Exposed as CSS variables consumed by
// .font-sketch / .font-hand.
const cabinSketch = Cabin_Sketch({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-cabin-sketch",
  display: "swap",
});
const caveat = Caveat({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://app.thefallsatlionsden.com"),
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
  // Link previews \u2014 iMessage, Slack, etc. pull these. Without an explicit
  // og:image they were scraping the first big image on the page (a cabin
  // photo). The custom 1200x630 banner lives at /public/og-image.png.
  openGraph: {
    type: "website",
    siteName: "The Falls at Lions Den",
    title: "The Falls at Lions Den",
    description:
      "Guide for your stay \u2014 map, cabins, trails, lakes, and how to find your way in.",
    url: "https://app.thefallsatlionsden.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Falls at Lions Den \u2014 Imperial, Missouri",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Falls at Lions Den",
    description:
      "Guide for your stay \u2014 map, cabins, trails, lakes, and how to find your way in.",
    images: ["/og-image.png"],
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
    <html
      lang="en"
      className={`h-full antialiased ${cabinSketch.variable} ${caveat.variable}`}
    >
      <body
        className="bg-[#0e0a08] text-[#F0E2C2]"
        style={{ minHeight: "100dvh" }}
      >
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
