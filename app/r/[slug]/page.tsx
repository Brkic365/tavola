import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { brandStyle } from "@/lib/theme";
import { getLocale } from "@/lib/locale";
import { t, localizeContent } from "@/lib/i18n";
import MenuBrowser from "@/components/MenuBrowser";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
    ...restaurant.categories.map((c) => ({
      key: c.id,
      name: localizeContent({ name: c.name }, c.translations, locale).name,
      dishes: localizeDishes(c.dishes),
    })),
    ...(restaurant.dishes.length > 0
      ? [
          {
            key: "uncategorized",
            name: "Other",
            dishes: localizeDishes(restaurant.dishes),
          },
        ]
      : []),
  ].filter((g) => g.dishes.length > 0);

  const totalDishes = groups.reduce((n, g) => n + g.dishes.length, 0);

  return (
    <div style={brandStyle(restaurant.brandColor)} className="flex flex-1 flex-col">
      <header className="bg-brand text-white">
        <div className="mx-auto w-full max-w-2xl px-5 py-8 text-center">
          <div className="mb-4 flex justify-end">
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
          <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
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

      <footer className="mx-auto w-full max-w-2xl px-5 py-8 text-center text-xs text-stone-400">
        <p>{t(locale, "kcalStatement")}</p>
        <p className="mt-1">
          Powered by <span className="font-serif">Tavola</span> · true-to-scale
          AR menus
        </p>
      </footer>
    </div>
  );
}
