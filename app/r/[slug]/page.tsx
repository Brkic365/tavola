import type { Metadata } from "next";
import Link from "next/link";
import { headers, cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Box, FileText, Phone, Globe } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { brandStyle } from "@/lib/theme";
import { getLocale } from "@/lib/locale";
import { menuJsonLd } from "@/lib/jsonld";
import { parseHours } from "@/lib/hours";
import OpeningHours from "@/components/OpeningHours";
import { t, localizeContent } from "@/lib/i18n";
import MenuBrowser from "@/components/MenuBrowser";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import TableCapture from "@/components/TableCapture";
import ThemeToggle from "@/components/ThemeToggle";
import { THEME_COOKIE } from "@/lib/theme-mode";

type Params = { params: Promise<{ slug: string }> };

async function getRestaurant(slug: string) {
  return prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          dishes: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
        },
      },
      // Dishes with no category — shown under an "Other" group.
      dishes: {
        where: { categoryId: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) return { title: "Menu not found · Tavola" };
  return {
    title: `${restaurant.name} · Menu`,
    description: `See every dish life-size in AR before you order at ${restaurant.name}.`,
  };
}

export default async function MenuPage({ params }: Params) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();

  const locale = await getLocale(undefined, restaurant.defaultLocale);
  // Strip the raw translations JSON before it reaches the client component —
  // only the resolved name/description for the active locale is sent.
  const localizeDishes = (dishes: typeof restaurant.dishes) =>
    dishes.map(({ translations, ...d }) => ({
      ...d,
      ...localizeContent(d, translations, locale),
    }));

  const groups = [
    ...restaurant.categories.map((c) => {
      const lc = localizeContent(
        { name: c.name, description: c.description },
        c.translations,
        locale,
      );
      return {
        key: c.id,
        name: lc.name,
        description: lc.description,
        dishes: localizeDishes(c.dishes),
      };
    }),
    ...(restaurant.dishes.length > 0
      ? [
          {
            key: "uncategorized",
            name: "Other",
            description: null,
            dishes: localizeDishes(restaurant.dishes),
          },
        ]
      : []),
  ].filter((g) => g.dishes.length > 0);

  const totalDishes = groups.reduce((n, g) => n + g.dishes.length, 0);

  // Structured data for search engines (Restaurant → Menu → MenuItem).
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const jsonLd = menuJsonLd(
    restaurant,
    groups,
    `${proto}://${host}/r/${restaurant.slug}`,
  );

  const hours = parseHours(restaurant.openingHours);

  const themeMode =
    (await cookies()).get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <div style={brandStyle(restaurant.brandColor)} className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <TableCapture />
      <header className="mx-auto w-full max-w-4xl px-4 pt-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {restaurant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logoUrl}
              alt=""
              className="h-11 w-11 rounded-full object-cover ring-1 ring-[var(--hairline)]"
            />
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <ThemeToggle initial={themeMode} />
            <LanguageSwitcher current={locale} />
          </div>
        </div>

        <h1 className="mt-5 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-strong sm:text-5xl">
          {restaurant.name}
        </h1>
        <p className="mt-1.5 text-base text-soft">
          {t(locale, "menu")} · {totalDishes} {t(locale, "dishesOnMenu")}
        </p>

        <div className="mt-5 flex items-start gap-3 rounded-xl bg-brand-soft p-4 text-strong">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
            <Box className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <p className="text-base leading-snug">{t(locale, "menuIntro")}</p>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-4xl flex-1 px-4 pb-10 pt-4 sm:px-6"
      >
        {groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-hair p-8 text-center text-soft">
            This menu has no dishes yet.
          </p>
        ) : (
          <MenuBrowser
            groups={groups}
            slug={restaurant.slug}
            currency={restaurant.currency}
            locale={locale}
          />
        )}
      </main>

      <footer className="mx-auto w-full max-w-4xl border-t border-hair px-4 py-8 text-center text-sm text-soft sm:px-6">
        {(restaurant.address || restaurant.phone || restaurant.website) && (
          <div className="mb-4 flex flex-col items-center gap-1 text-sm text-soft">
            {restaurant.address && <p>{restaurant.address}</p>}
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {restaurant.phone}
                </a>
              )}
              {restaurant.website && (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {restaurant.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </p>
          </div>
        )}
        {hours && <OpeningHours days={hours} locale={locale} />}
        <p>{t(locale, "kcalStatement")}</p>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link
            href={`/r/${restaurant.slug}/menu`}
            className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-strong underline underline-offset-4"
          >
            <FileText className="h-4 w-4" strokeWidth={2} aria-hidden />
            {t(locale, "printable")}
          </Link>
          <Link
            href="/credits"
            className="inline-flex min-h-11 items-center font-semibold text-strong underline underline-offset-4"
          >
            {t(locale, "scanCredits")}
          </Link>
        </p>
        <p className="mt-3">
          <Link href="/" className="hover:text-strong">
            Menu by Tavola
          </Link>
        </p>
      </footer>
    </div>
  );
}
