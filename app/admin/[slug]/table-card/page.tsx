import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManageRestaurant } from "@/lib/session";
import { brandStyle } from "@/lib/theme";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import PrintButton from "@/components/PrintButton";

type Params = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: "Table card · Tavola" };

/**
 * Print-ready table card an operator can print and place on each table:
 * branded header, a high-res QR to the public menu, and a short scan prompt —
 * localized to the restaurant's default language (it's guest-facing).
 */
export default async function TableCardPage({ params }: Params) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) notFound();
  if (!(await canManageRestaurant(user, restaurant.id))) redirect("/admin");

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const menuUrl = `${proto}://${host}/r/${slug}`;

  const locale = await getLocale(undefined, restaurant.defaultLocale);

  // High-resolution QR so the print stays crisp at any physical size.
  const qr = await QRCode.toDataURL(menuUrl, {
    width: 720,
    margin: 1,
    color: { dark: "#1c1917", light: "#ffffff" },
  });

  return (
    <main
      id="main-content"
      style={brandStyle(restaurant.brandColor)}
      className="mx-auto w-full max-w-2xl flex-1 px-5 py-8"
    >
      {/* Controls — hidden when printing */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/admin/${slug}`}
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          ← Back to manage
        </Link>
        <PrintButton label="Print table card" />
      </div>
      <p className="mb-6 text-sm text-stone-500 print:hidden">
        Print this and place one on each table. Tip: print several copies, or
        set your printer to 2-up to get two cards per sheet.
      </p>

      {/* The card itself */}
      <article className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-stone-200 bg-white text-center shadow-sm print:border-stone-300 print:shadow-none">
        <div className="bg-brand px-8 py-6 text-white">
          {restaurant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logoUrl}
              alt=""
              className="mx-auto mb-3 h-14 w-14 rounded-full object-cover ring-2 ring-white/40"
            />
          )}
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            {restaurant.name}
          </h1>
          <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-white/80">
            {t(locale, "scanForMenu")}
          </p>
        </div>

        <div className="px-8 py-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt={`QR code linking to ${menuUrl}`}
            width={240}
            height={240}
            className="mx-auto h-60 w-60 rounded-xl ring-1 ring-stone-200"
          />
          <p className="mt-5 text-sm leading-relaxed text-stone-600">
            {t(locale, "scanHowto")}
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
            📐 {t(locale, "tagline")}
          </p>
          <p className="mt-5 break-all text-[11px] text-stone-400">{menuUrl}</p>
        </div>

        <div className="border-t border-stone-100 px-8 py-3 text-[11px] text-stone-400">
          Powered by <span className="font-serif">Tavola</span>
        </div>
      </article>
    </main>
  );
}
