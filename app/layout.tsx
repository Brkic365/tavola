import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import "./globals.css";

// One family, two voices: Archivo at normal width for reading (plain, open
// shapes, unambiguous numbers for prices) and narrowed via its width axis for
// headings, so long dish names fit on a phone. See .font-display in globals.
const archivo = Archivo({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Tavola · Restaurant menus in 3D",
  description:
    "Guests scan the QR code on the table and see every dish in 3D, at its real size, before they order. No app needed.",
};

// Mobile-first: guests open this on their phones at the table.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f3ef",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
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
