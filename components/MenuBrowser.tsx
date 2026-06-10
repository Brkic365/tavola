"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import DishCard from "@/components/DishCard";
import DishThumb from "@/components/DishThumb";
import { formatPrice } from "@/lib/format";
import { parseDietary, type DietaryInfo } from "@/lib/dietary";
import { parseAllergens, type AllergenInfo } from "@/lib/allergens";
import { t, type Locale } from "@/lib/i18n";

export type MenuDish = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  thumbnailUrl: string | null;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  weightG: number | null;
  serves: string | null;
  allergens: string | null;
  calories: number | null;
  dietary: string | null;
  featured: boolean;
  available: boolean;
  variants?: unknown;
};

type Group = {
  key: string;
  name: string;
  description?: string | null;
  dishes: MenuDish[];
};

/**
 * Guest-facing menu with dietary + allergen filtering. A dish must carry ALL
 * selected dietary tags and NONE of the "avoid" allergens to remain visible —
 * the consumer side of Tavola's transparency/compliance angle.
 */
export default function MenuBrowser({
  groups,
  slug,
  currency,
  locale,
}: {
  groups: Group[];
  slug: string;
  currency: string;
  locale: Locale;
}) {
  const allDishes = useMemo(() => groups.flatMap((g) => g.dishes), [groups]);

  // Spotlight: in-stock chef's picks, surfaced at the top when not filtering.
  const featured = useMemo(
    () => allDishes.filter((d) => d.featured && d.available),
    [allDishes],
  );

  const dietaryOptions = useMemo(() => {
    const map = new Map<string, DietaryInfo>();
    for (const d of allDishes)
      for (const info of parseDietary(d.dietary, locale)) map.set(info.key, info);
    return [...map.values()];
  }, [allDishes, locale]);

  const allergenOptions = useMemo(() => {
    const map = new Map<string, AllergenInfo>();
    for (const d of allDishes)
      for (const a of parseAllergens(d.allergens, locale)) map.set(a.key, a);
    return [...map.values()];
  }, [allDishes, locale]);

  const [diet, setDiet] = useState<Set<string>>(new Set());
  const [avoid, setAvoid] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  function toggle(setter: typeof setDiet, key: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (d: MenuDish) => {
      if (q) {
        const hay = `${d.name} ${d.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const dTags = new Set(parseDietary(d.dietary).map((x) => x.key));
      for (const k of diet) if (!dTags.has(k)) return false;
      const aTags = new Set(parseAllergens(d.allergens).map((x) => x.key));
      for (const k of avoid) if (aTags.has(k)) return false;
      return true;
    };
    return groups
      .map((g) => ({ ...g, dishes: g.dishes.filter(matches) }))
      .filter((g) => g.dishes.length > 0);
  }, [groups, diet, avoid, query]);

  const total = filteredGroups.reduce((n, g) => n + g.dishes.length, 0);
  const active = diet.size + avoid.size > 0 || query.trim().length > 0;
  const hasChips = dietaryOptions.length > 0 || allergenOptions.length > 0;

  function clearAll() {
    setDiet(new Set());
    setAvoid(new Set());
    setQuery("");
  }

  return (
    <div>
      <div className="mb-8 space-y-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          >
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(locale, "searchDishes")}
            aria-label={t(locale, "searchDishes")}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-9 text-sm text-stone-800 placeholder:text-stone-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t(locale, "clearSearch")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              ✕
            </button>
          )}
        </div>

        {hasChips && (
          <>
            {dietaryOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                {t(locale, "dietary")}
              </span>
              {dietaryOptions.map((d) => {
                const on = diet.has(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(setDiet, d.key)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                      on
                        ? "bg-emerald-600 text-white ring-emerald-600"
                        : "bg-emerald-50 text-emerald-800 ring-emerald-100 hover:bg-emerald-100"
                    }`}
                  >
                    <span aria-hidden>{d.icon}</span> {d.label}
                  </button>
                );
              })}
            </div>
          )}

            {allergenOptions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {t(locale, "avoid")}
                </span>
                {allergenOptions.map((a) => {
                  const on = avoid.has(a.key);
                  return (
                    <button
                      key={a.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(setAvoid, a.key)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                        on
                          ? "bg-rose-600 text-white ring-rose-600"
                          : "bg-stone-50 text-stone-600 ring-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      <span aria-hidden>{a.icon}</span> {t(locale, "no")}{" "}
                      {a.label.toLowerCase()}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {active && (
          <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-xs">
            <span className="text-stone-500">
              {total} {t(locale, "match")}
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="font-medium text-teal-700 hover:underline"
            >
              {t(locale, "clearFilters")}
            </button>
          </div>
        )}
      </div>

      {!active && featured.length > 0 && (
        <section className="mb-8" aria-label={t(locale, "chefsPicks")}>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-amber-500">★</span>
            <h2 className="font-serif text-lg font-semibold tracking-tight text-stone-800">
              {t(locale, "chefsPicks")}
            </h2>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-5 sm:px-5">
            {featured.map((d) => (
              <Link
                key={d.id}
                href={`/r/${slug}/dish/${d.id}`}
                className="group flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative h-24 w-full overflow-hidden">
                  <DishThumb
                    name={d.name}
                    seed={d.id}
                    thumbnailUrl={d.thumbnailUrl}
                  />
                  <span className="absolute bottom-1 right-1 rounded-md bg-stone-900/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    3D · AR
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2.5">
                  <span className="line-clamp-2 font-serif text-sm font-semibold leading-snug text-stone-900">
                    {d.name}
                  </span>
                  <span className="mt-auto text-sm font-semibold text-stone-700">
                    {formatPrice(d.price, currency)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {filteredGroups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
          {t(locale, "noMatch")}{" "}
          <button
            type="button"
            onClick={clearAll}
            className="font-medium text-teal-700 hover:underline"
          >
            {t(locale, "clearFilters")}
          </button>
        </p>
      ) : (
        <div className="space-y-12">
          {filteredGroups.length >= 2 && (
            <nav
              aria-label={t(locale, "menu")}
              className="sticky top-0 z-10 -mx-4 mb-2 flex gap-2 overflow-x-auto border-b border-stone-200/70 bg-white/85 px-4 py-2.5 backdrop-blur [scrollbar-width:none] sm:-mx-5 sm:px-5"
            >
              {filteredGroups.map((group) => (
                <button
                  key={group.key}
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(`cat-sec-${group.key}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="shrink-0 whitespace-nowrap rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700 transition hover:bg-stone-200"
                >
                  {group.name}
                </button>
              ))}
            </nav>
          )}
          {filteredGroups.map((group) => (
            <section
              key={group.key}
              id={`cat-sec-${group.key}`}
              className="scroll-mt-16"
            >
              <div
                className={`flex items-center gap-4 ${
                  group.description ? "mb-2" : "mb-5"
                }`}
              >
                <span className="h-px flex-1 bg-stone-300/70" />
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-800">
                  {group.name}
                </h2>
                <span className="h-px flex-1 bg-stone-300/70" />
              </div>
              {group.description && (
                <p className="mb-5 text-center text-sm italic text-stone-500">
                  {group.description}
                </p>
              )}
              <ul className="divide-y divide-stone-200/80 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                {group.dishes.map((dish) => (
                  <li key={dish.id}>
                    <DishCard
                      slug={slug}
                      currency={currency}
                      dish={dish}
                      locale={locale}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {(allergenOptions.length > 0 || dietaryOptions.length > 0) && (
        <details className="mt-10 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-stone-700">
            {t(locale, "allergenKey")}
          </summary>
          {dietaryOptions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                {t(locale, "dietary")}
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-stone-600">
                {dietaryOptions.map((d) => (
                  <li key={d.key} className="inline-flex items-center gap-1.5">
                    <span aria-hidden>{d.icon}</span>
                    {d.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {allergenOptions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                {t(locale, "allergens")}
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-stone-600">
                {allergenOptions.map((a) => (
                  <li key={a.key} className="inline-flex items-center gap-1.5">
                    <span aria-hidden>{a.icon}</span>
                    {a.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </details>
      )}
    </div>
  );
}
