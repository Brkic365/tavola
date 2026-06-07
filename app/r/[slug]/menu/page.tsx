import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDimensions, formatWeight } from "@/lib/format";
import { parseAllergens } from "@/lib/allergens";
import { parseDietary } from "@/lib/dietary";
import { getLocale } from "@/lib/locale";
import { t, localizeContent } from "@/lib/i18n";
import PrintButton from "@/components/PrintButton";

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
      dishes: {
        where: { categoryId: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const r = await prisma.restaurant.findUnique({ where: { slug } });
  return { title: r ? `${r.name} · Text menu` : "Menu not found · Tavola" };
}

/**
 * Accessible, no-JS, printable plain-text menu — the screen-reader-friendly and
 * "no smartphone" fallback for the interactive AR menu, from the same data.
 * Print it for guests without a phone; it's a proper text alternative for a11y.
 */
export default async function TextMenuPage({ params }: Params) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();

  const locale = await getLocale();
  const localizeDishes = (dishes: typeof restaurant.dishes) =>
    dishes.map((d) => ({ ...d, ...localizeContent(d, d.translations, locale) }));

  const groups = [
    ...restaurant.categories.map((c) => ({
      key: c.id,
      name: localizeContent({ name: c.name }, c.translations, locale).name,
      dishes: localizeDishes(c.dishes),
    })),
    ...(restaurant.dishes.length > 0
      ? [{ key: "other", name: "Other", dishes: localizeDishes(restaurant.dishes) }]
      : []),
  ].filter((g) => g.dishes.length > 0);

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 text-stone-900"
    >
      {/* Controls — hidden when printing */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/r/${slug}`}
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          ← {t(locale, "interactiveMenu")}
        </Link>
        <PrintButton label={t(locale, "print")} />
      </div>

      <header className="mb-6 border-b border-stone-300 pb-4 text-center">
        <h1 className="font-serif text-3xl font-bold">{restaurant.name}</h1>
        <p className="mt-1 text-sm text-stone-600">{t(locale, "menu")}</p>
      </header>

      {groups.length === 0 ? (
        <p className="text-stone-600">This menu has no dishes yet.</p>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`cat-${group.key}`}>
              <h2
                id={`cat-${group.key}`}
                className="mb-3 border-b border-stone-200 pb-1 font-serif text-xl font-semibold"
              >
                {group.name}
              </h2>
              <ul className="space-y-4">
                {group.dishes.map((dish) => {
                  const dims = formatDimensions(
                    dish.widthCm,
                    dish.depthCm,
                    dish.heightCm,
                  );
                  const weight = formatWeight(dish.weightG);
                  const allergens = parseAllergens(dish.allergens, locale);
                  const dietary = parseDietary(dish.dietary, locale);
                  const portion = [
                    dish.serves ? `${t(locale, "serves")} ${dish.serves}` : null,
                    dims,
                    weight,
                    dish.calories != null ? `${dish.calories} kcal` : null,
                  ].filter(Boolean);

                  return (
                    <li key={dish.id}>
                      <article className="break-inside-avoid">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-serif text-lg font-semibold">
                            {dish.name}
                          </h3>
                          <span className="shrink-0 font-serif text-lg font-semibold tabular-nums">
                            {formatPrice(dish.price, restaurant.currency)}
                          </span>
                        </div>
                        {dish.description && (
                          <p
                            lang={locale}
                            className="mt-0.5 text-sm leading-relaxed text-stone-600"
                          >
                            {dish.description}
                          </p>
                        )}
                        {portion.length > 0 && (
                          <p className="mt-1 text-sm text-stone-500">
                            {portion.join(" · ")}
                          </p>
                        )}
                        {allergens.length > 0 && (
                          <p className="mt-1 text-sm text-stone-700">
                            <span className="font-semibold">
                              {t(locale, "allergens")}:
                            </span>{" "}
                            {allergens.map((a) => a.label).join(", ")}
                          </p>
                        )}
                        {dietary.length > 0 && (
                          <p className="mt-0.5 text-sm text-stone-700">
                            <span className="font-semibold">
                              {t(locale, "dietary")}:
                            </span>{" "}
                            {dietary.map((d) => d.label).join(", ")}
                          </p>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <footer className="mt-10 border-t border-stone-300 pt-4 text-center text-xs text-stone-500">
        <p>{t(locale, "kcalStatement")}</p>
        <p className="mt-1">Powered by Tavola.</p>
      </footer>
    </main>
  );
}
