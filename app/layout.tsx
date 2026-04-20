import type { Metadata, Viewport } from "next";
import { DM_Sans, Quicksand } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const display = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const body = Quicksand({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PlateMap — Halal · Vegetarian · Vegan · Jain in Bangalore",
    template: "%s · PlateMap",
  },
  description:
    "A map-first restaurant finder for Halal, Vegetarian, Vegan, and Jain dining in Bangalore. Color-coded markers. No guessing.",
  keywords: [
    "halal bangalore",
    "vegan bangalore",
    "jain restaurants bangalore",
    "vegetarian restaurants bangalore",
    "halal food near me",
    "platemap",
  ],
  openGraph: {
    title: "PlateMap",
    description:
      "Halal, Vegetarian, Vegan, and Jain restaurants in Bangalore — on one map.",
    url: siteUrl,
    siteName: "PlateMap",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlateMap",
    description:
      "Halal, Vegetarian, Vegan, and Jain restaurants — on one map.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="en" className={`dark ${display.variable} ${body.variable}`}>
      <body className="bg-bg text-text antialiased">
        {children}
        <Toaster />
        {adsenseId ? (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
