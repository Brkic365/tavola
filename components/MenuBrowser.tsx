"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Plus, Check, SlidersHorizontal } from "lucide-react";
import DishCard from "@/components/DishCard";
import TablePlanner from "@/components/TablePlanner";
import { parseDietary, type DietaryInfo } from "@/lib/dietary";
import { parseAllergens, type AllergenInfo } from "@/lib/allergens";
import { allergenIcon, dietaryIcon } from "@/lib/glyphs";
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

// Case- and accent-insensitive, so "rizot" finds "rižot" (đ has no decomposition).
const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

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

  // "My table" picks, kept per restaurant so a reload or dish visit keeps them.
  const storeKey = `tavola_table_${slug}`;
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [party, setParty] = useState(2);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate after mount (SSR has no storage)
      if (saved?.picks) setPicks(saved.picks);
      if (saved?.party) setParty(saved.party);
    } catch {}
    setLoaded(true);
  }, [storeKey]);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storeKey, JSON.stringify({ picks, party }));
    } catch {}
  }, [loaded, storeKey, picks, party]);
  function setQty(id: string, qty: number) {
    setPicks((prev) => {
      const next = { ...prev };
      if (qty > 0) next[id] = qty;
      else delete next[id];
      return next;
    });
  }

  function toggle(setter: typeof setDiet, key: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filteredGroups = useMemo(() => {
    const q = fold(query.trim());
    const matches = (d: MenuDish) => {
      if (q) {
        const hay = fold(`${d.name} ${d.description ?? ""}`);
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

  const filterCount = diet.size + avoid.size;
  const [filtersOpen, setFiltersOpen] = useState(false);

  const chip = (on: boolean) =>
    `inline-flex min-h-11 items-center gap-2 rounded-lg border px-3.5 text-[0.95rem] font-semibold transition ${
      on
        ? "border-transparent text-white"
        : "border-hair surface text-strong hover:border-[var(--muted)]"
    }`;

  return (
    <div>
      {/* Categories: a plain tab bar that stays put while scrolling. */}
      {groups.length >= 2 && (
        <nav
          aria-label={t(locale, "menu")}
          className="sticky top-0 z-20 -mx-4 border-b border-hair bg-[var(--background)] sm:-mx-6"
        >
          <div className="flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6">
            {filteredGroups.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() =>
                  document
                    .getElementById(`cat-sec-${group.key}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="min-h-12 shrink-0 whitespace-nowrap border-b-[3px] border-transparent px-3 text-base font-bold text-strong transition hover:border-[var(--brand)]"
              >
                {group.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Search + one button for allergies/diet (hidden until asked for). */}
      <div className="mt-4 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-soft"
            strokeWidth={2}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(locale, "searchDishes")}
            aria-label={t(locale, "searchDishes")}
            className="min-h-12 w-full rounded-lg border border-hair surface py-2.5 pl-11 pr-11 text-base text-strong placeholder:text-soft focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t(locale, "clearSearch")}
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-soft hover:bg-[var(--card-2)] hover:text-strong"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          )}
        </div>
        {hasChips && (
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-controls="menu-filters"
            className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-lg border px-3.5 text-base font-bold transition ${
              filterCount > 0 || filtersOpen
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                : "border-hair surface text-strong"
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" strokeWidth={2} aria-hidden />
            <span className="whitespace-nowrap sm:hidden">
              {t(locale, "allergiesShort")}
            </span>
            <span className="hidden whitespace-nowrap sm:inline">
              {t(locale, "allergiesDiet")}
            </span>
            {filterCount > 0 && (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--background)] px-1.5 text-sm text-[var(--foreground)]">
                {filterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {hasChips && filtersOpen && (
        <div
          id="menu-filters"
          className="mt-2 space-y-4 rounded-xl border border-hair surface p-4"
        >
          {allergenOptions.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-base font-bold text-strong">
                {t(locale, "avoid")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {allergenOptions.map((a) => {
                  const on = avoid.has(a.key);
                  const Icon = allergenIcon(a.key);
                  return (
                    <button
                      key={a.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(setAvoid, a.key)}
                      className={chip(on)}
                      style={on ? { backgroundColor: "#be123c" } : undefined}
                    >
                      {on ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                      ) : (
                        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                      )}
                      {/* "No dairy" only reads right in English; the "Avoid" heading covers other languages. */}
                      {locale === "en" ? `No ${a.label.toLowerCase()}` : a.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
          {dietaryOptions.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-base font-bold text-strong">
                {t(locale, "showOnly")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((d) => {
                  const on = diet.has(d.key);
                  const Icon = dietaryIcon(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(setDiet, d.key)}
                      className={chip(on)}
                      style={on ? { backgroundColor: "var(--olive)" } : undefined}
                    >
                      {on ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                      ) : (
                        <Icon
                          className="h-4 w-4"
                          strokeWidth={1.75}
                          style={{ color: "var(--olive)" }}
                          aria-hidden
                        />
                      )}
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
          <div className="flex items-center justify-between border-t border-hair pt-3">
            {filterCount > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="min-h-11 text-base font-semibold text-brand underline underline-offset-4"
              >
                {t(locale, "clearFilters")}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--foreground)] px-5 text-base font-bold text-[var(--background)]"
            >
              {t(locale, "done")} · {total}
            </button>
          </div>
        </div>
      )}

      {active && !filtersOpen && (
        <div className="mt-3 flex items-center justify-between text-base">
          <span className="text-soft">
            {total} {t(locale, "match")}
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="min-h-11 font-semibold text-brand underline underline-offset-4"
          >
            {t(locale, "clearFilters")}
          </button>
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-hair p-8 text-center text-base text-soft">
          {t(locale, "noMatch")}{" "}
          <button
            type="button"
            onClick={clearAll}
            className="font-semibold text-brand underline underline-offset-4"
          >
            {t(locale, "clearFilters")}
          </button>
        </p>
      ) : (
        <div className="mt-8 space-y-12">
          {filteredGroups.map((group) => (
            <section
              key={group.key}
              id={`cat-sec-${group.key}`}
              className="scroll-mt-16"
              aria-labelledby={`cat-h-${group.key}`}
            >
              <h2
                id={`cat-h-${group.key}`}
                className="font-display text-3xl font-extrabold uppercase tracking-tight text-strong"
              >
                {group.name}
              </h2>
              {group.description && (
                <p className="mt-1 text-base text-soft">{group.description}</p>
              )}
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {group.dishes.map((dish) => (
                  <li key={dish.id}>
                    <DishCard
                      slug={slug}
                      currency={currency}
                      dish={dish}
                      locale={locale}
                      action={
                        dish.available ? (
                          <button
                            type="button"
                            onClick={() =>
                              setQty(dish.id, (picks[dish.id] ?? 0) + 1)
                            }
                            aria-label={`${t(locale, "addToTable")}: ${dish.name}`}
                            className={`inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-lg border px-3.5 text-base font-bold transition active:scale-[0.98] ${
                              picks[dish.id]
                                ? "border-[var(--brand)] text-brand"
                                : "border-hair text-strong hover:border-[var(--muted)]"
                            }`}
                          >
                            {picks[dish.id] ? (
                              <>
                                <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                                {picks[dish.id]}
                              </>
                            ) : (
                              <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                            )}
                            <span>{t(locale, "myTable")}</span>
                          </button>
                        ) : undefined
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {(allergenOptions.length > 0 || dietaryOptions.length > 0) && (
        <details className="mt-12 rounded-xl border border-hair surface p-4">
          <summary className="min-h-8 cursor-pointer text-base font-bold text-strong">
            {t(locale, "allergenKey")}
          </summary>
          {dietaryOptions.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-bold text-soft">{t(locale, "dietary")}</p>
              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-base text-strong">
                {dietaryOptions.map((d) => {
                  const Icon = dietaryIcon(d.key);
                  return (
                    <li key={d.key} className="inline-flex items-center gap-2">
                      <Icon
                        className="h-5 w-5"
                        strokeWidth={1.75}
                        style={{ color: "var(--olive)" }}
                        aria-hidden
                      />
                      {d.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {allergenOptions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold text-soft">{t(locale, "allergens")}</p>
              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-base text-strong">
                {allergenOptions.map((a) => {
                  const Icon = allergenIcon(a.key);
                  return (
                    <li key={a.key} className="inline-flex items-center gap-2">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                      {a.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </details>
      )}

      <TablePlanner
        dishes={allDishes}
        picks={picks}
        setQty={setQty}
        party={party}
        setParty={setParty}
        currency={currency}
        locale={locale}
      />
      {/* keep the last dishes reachable above the fixed bar */}
      {Object.keys(picks).length > 0 && <div className="h-32" aria-hidden />}
    </div>
  );
}
