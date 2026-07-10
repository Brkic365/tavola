import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { Ruler } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManageRestaurant } from "@/lib/session";
import { brandStyle } from "@/lib/theme";
import { getLocale } from "@/lib/locale";
import { t, type Locale } from "@/lib/i18n";
import PrintButton from "@/components/PrintButton";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = { title: "Table cards · Tavola" };

const MAX_TABLES = 50;

async function qrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 720,
    margin: 1,
    color: { dark: "#1c1917", light: "#ffffff" },
  });
}

/**
 * Print-ready table cards. With no query it renders one generic card; with
 * ?tables=N it renders N numbered cards (QR → /r/[slug]?table=i) in a print
 * grid, so each table's scans are attributed to that table in analytics.
 */
export default async function TableCardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

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

  const rawCount = Number(typeof sp.tables === "string" ? sp.tables : "");
  const tableCount =
    Number.isFinite(rawCount) && rawCount >= 1
      ? Math.min(MAX_TABLES, Math.floor(rawCount))
      : 0;

  // Build the cards: either N numbered tables or one generic card.
  const cards = tableCount
    ? await Promise.all(
        Array.from({ length: tableCount }, async (_, i) => {
          const n = i + 1;
          return {
            key: `t${n}`,
            label: `${t(locale, "table")} ${n}`,
            qr: await qrDataUrl(`${menuUrl}?table=${n}`),
            url: `${menuUrl}?table=${n}`,
          };
        }),
      )
    : [
        {
          key: "generic",
          label: null,
          qr: await qrDataUrl(menuUrl),
          url: menuUrl,
        },
      ];

  return (
    <main
      id="main-content"
      style={brandStyle(restaurant.brandColor)}
      className="mx-auto w-full max-w-3xl flex-1 px-5 py-8"
    >
      {/* Controls — hidden when printing */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href={`/admin/${slug}`}
          className="text-sm font-medium text-accent-strong hover:underline"
        >
          ← Back to manage
        </Link>
        <PrintButton label="Print cards" />
      </div>

      <form className="mb-2 flex flex-wrap items-end gap-3 print:hidden">
        <label className="text-sm">
          <span className="block font-medium text-stone-700">
            Number of tables
          </span>
          <input
            type="number"
            name="tables"
            min={1}
            max={MAX_TABLES}
            defaultValue={tableCount || ""}
            placeholder="e.g. 12"
            className="mt-1 w-32 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900"
        >
          Generate numbered cards
        </button>
        {tableCount > 0 && (
          <Link
            href={`/admin/${slug}/table-card`}
            className="text-sm font-medium text-stone-500 hover:underline"
          >
            ← Single generic card
          </Link>
        )}
      </form>
      <p className="mb-6 text-sm text-stone-500 print:hidden">
        {tableCount > 0
          ? `Each card sends its table's scans to analytics (?table=N). Print and place one per table.`
          : `One generic card for the whole venue. Enter a table count above to generate per-table cards with tracking.`}
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {cards.map((c) => (
          <article
            key={c.key}
            className="mx-auto w-full max-w-sm break-inside-avoid overflow-hidden rounded-3xl border border-stone-200 bg-white text-center shadow-sm print:border-stone-300 print:shadow-none"
          >
            <div className="bg-brand px-6 py-5 text-white">
              {restaurant.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurant.logoUrl}
                  alt=""
                  className="mx-auto mb-2 h-12 w-12 rounded-full object-cover ring-2 ring-white/40"
                />
              )}
              <h1 className="font-serif text-xl font-bold tracking-tight">
                {restaurant.name}
              </h1>
              {c.label ? (
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.2em] text-white">
                  {c.label}
                </p>
              ) : (
                <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-white/80">
                  {t(locale, "scanForMenu")}
                </p>
              )}
            </div>

            <div className="px-6 py-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.qr}
                alt={`QR code linking to ${c.url}`}
                width={220}
                height={220}
                className="mx-auto h-52 w-52 rounded-xl ring-1 ring-stone-200"
              />
              <p className="mt-4 text-sm leading-relaxed text-stone-600">
                {t(locale, "scanHowto")}
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                <Ruler className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t(locale, "tagline")}
              </p>
            </div>

            <div className="border-t border-stone-100 px-6 py-2.5 text-[11px] text-stone-400">
              Powered by <span className="font-serif">Tavola</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
