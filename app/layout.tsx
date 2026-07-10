import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

// Humanist sans for body/UI — warm, legible, pairs with Fraunces.
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fraunces — a warm, high-contrast "old style" serif with optical sizing; the
// editorial voice for headings, dish names and prices.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tavola — see your dish, life-size, before you order",
  description:
    "Scan, tap a dish, and view it in AR at true real-world scale. Real dimensions, weight, and portions — no more 'the photo looked bigger'.",
};

// Mobile-first: guests open this on their phones at the table.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-2 focus:top-2"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
