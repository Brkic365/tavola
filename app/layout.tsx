import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Elegant high-contrast serif for the restaurant-menu feel (headings, prices).
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-2 focus:top-2"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
