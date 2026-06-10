import type { Metadata } from "next";
import Link from "next/link";
import { headers, cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { brandStyle } from "@/lib/theme";
import { getLocale } from "@/lib/locale";
import { menuJsonLd } from "@/lib/jsonld";
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

  const themeMode =
    (await cookies()).get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <div style={brandStyle(restaurant.brandColor)} className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <TableCapture />
      <header className="bg-brand text-white">
        <div className="mx-auto w-full max-w-2xl px-5 py-8 text-center">
          <div className="mb-4 flex items-center justify-end gap-2">
            <ThemeToggle initial={themeMode} />
            <LanguageSwitcher current={locale} />
          </div>
          {restaurant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logoUrl}
              alt={restaurant.name}
              className="mx-auto mb-4 h-16 w-16 rounded-full object-cover ring-2 ring-white/40"
            />
          )}
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/70">
            {t(locale, "menu")}
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight">
            {restaurant.name}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {totalDishes} · {t(locale, "tapHint")}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm">
            📐 {t(locale, "tagline")}
          </p>
          <p className="mt-3 text-sm">
            <Link
              href={`/r/${restaurant.slug}/menu`}
              className="text-white/80 underline underline-offset-2 hover:text-white"
            >
              📄 {t(locale, "printable")}
            </Link>
          </p>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-5"
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

      <footer className="mx-auto w-full max-w-2xl px-5 py-8 text-center text-xs text-soft">
        {(restaurant.address || restaurant.phone || restaurant.website) && (
          <div className="mb-4 flex flex-col items-center gap-1 text-sm text-soft">
            {restaurant.address && <p>{restaurant.address}</p>}
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone.replace(/\s+/g, "")}`}
                  className="font-medium text-brand hover:underline"
                >
                  📞 {restaurant.phone}
                </a>
              )}
              {restaurant.website && (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand hover:underline"
                >
                  🌐 {restaurant.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </p>
          </div>
        )}
        <p>{t(locale, "kcalStatement")}</p>
        <p className="mt-1">
          Powered by <span className="font-serif">Tavola</span> · true-to-scale
          AR menus
        </p>
      </footer>
    </div>
  );
}
