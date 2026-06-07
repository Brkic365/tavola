"use client";

import { useMemo, useState } from "react";
import DishCard from "@/components/DishCard";
import { parseDietary, type DietaryInfo } from "@/lib/dietary";
import { parseAllergens, type AllergenInfo } from "@/lib/allergens";

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
};

type Group = { key: string; name: string; dishes: MenuDish[] };

/**
 * Guest-facing menu with dietary + allergen filtering. A dish must carry ALL
 * selected dietary tags and NONE of the "avoid" allergens to remain visible —
 * the consumer side of Tavola's transparency/compliance angle.
 */
export default function MenuBrowser({
  groups,
  slug,
  currency,
}: {
  groups: Group[];
  slug: string;
  currency: string;
}) {
  const allDishes = useMemo(() => groups.flatMap((g) => g.dishes), [groups]);

  const dietaryOptions = useMemo(() => {
    const map = new Map<string, DietaryInfo>();
    for (const d of allDishes)
      for (const t of parseDietary(d.dietary)) map.set(t.key, t);
    return [...map.values()];
  }, [allDishes]);

  const allergenOptions = useMemo(() => {
    const map = new Map<string, AllergenInfo>();
    for (const d of allDishes)
      for (const a of parseAllergens(d.allergens)) map.set(a.key, a);
    return [...map.values()];
  }, [allDishes]);

  const [diet, setDiet] = useState<Set<string>>(new Set());
  const [avoid, setAvoid] = useState<Set<string>>(new Set());

  function toggle(setter: typeof setDiet, key: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filteredGroups = useMemo(() => {
    const matches = (d: MenuDish) => {
      const dTags = new Set(parseDietary(d.dietary).map((x) => x.key));
      for (const k of diet) if (!dTags.has(k)) return false;
      const aTags = new Set(parseAllergens(d.allergens).map((x) => x.key));
      for (const k of avoid) if (aTags.has(k)) return false;
      return true;
    };
    return groups
      .map((g) => ({ ...g, dishes: g.dishes.filter(matches) }))
      .filter((g) => g.dishes.length > 0);
  }, [groups, diet, avoid]);

  const total = filteredGroups.reduce((n, g) => n + g.dishes.length, 0);
  const active = diet.size + avoid.size > 0;
  const hasFilters = dietaryOptions.length > 0 || allergenOptions.length > 0;

  return (
    <div>
      {hasFilters && (
        <div className="mb-8 space-y-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
          {dietaryOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Dietary
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
                Avoid
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
                    <span aria-hidden>{a.icon}</span> No {a.label.toLowerCase()}
                  </button>
                );
              })}
            </div>
          )}

          {active && (
            <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-xs">
              <span className="text-stone-500">
                {total} {total === 1 ? "dish" : "dishes"} match
              </span>
              <button
                type="button"
                onClick={() => {
                  setDiet(new Set());
                  setAvoid(new Set());
                }}
                className="font-medium text-teal-700 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
          No dishes match those filters.{" "}
          <button
            type="button"
            onClick={() => {
              setDiet(new Set());
              setAvoid(new Set());
            }}
            className="font-medium text-teal-700 hover:underline"
          >
            Clear
          </button>
        </p>
      ) : (
        <div className="space-y-12">
          {filteredGroups.map((group) => (
            <section key={group.key}>
              <div className="mb-5 flex items-center gap-4">
                <span className="h-px flex-1 bg-stone-300/70" />
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-800">
                  {group.name}
                </h2>
                <span className="h-px flex-1 bg-stone-300/70" />
              </div>
              <ul className="divide-y divide-stone-200/80 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                {group.dishes.map((dish) => (
                  <li key={dish.id}>
                    <DishCard slug={slug} currency={currency} dish={dish} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
