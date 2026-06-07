// Dietary attributes are stored as a comma-separated string on Dish.dietary
// (positive attributes a guest can filter the menu by). Labels are localized.

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export type DietaryInfo = { key: string; label: string; icon: string };

type Labels = Record<Locale, string>;

const DIETARY_MAP: Record<string, { icon: string; labels: Labels }> = {
  vegetarian: { icon: "🥬", labels: { en: "Vegetarian", hr: "Vegetarijansko", de: "Vegetarisch", it: "Vegetariano" } },
  vegan: { icon: "🌿", labels: { en: "Vegan", hr: "Vegansko", de: "Vegan", it: "Vegano" } },
  "gluten-free": { icon: "🌾", labels: { en: "Gluten-free", hr: "Bez glutena", de: "Glutenfrei", it: "Senza glutine" } },
  "dairy-free": { icon: "🥛", labels: { en: "Dairy-free", hr: "Bez mlijeka", de: "Laktosefrei", it: "Senza lattosio" } },
  pescatarian: { icon: "🐟", labels: { en: "Pescatarian", hr: "Pescetarijansko", de: "Pescetarisch", it: "Pescetariano" } },
  "nut-free": { icon: "🥜", labels: { en: "Nut-free", hr: "Bez orašastih", de: "Nussfrei", it: "Senza frutta a guscio" } },
  halal: { icon: "☪️", labels: { en: "Halal", hr: "Halal", de: "Halal", it: "Halal" } },
  spicy: { icon: "🌶️", labels: { en: "Spicy", hr: "Ljuto", de: "Scharf", it: "Piccante" } },
};

function pretty(k: string): string {
  return k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, " ");
}

export function parseDietary(
  raw?: string | null,
  locale: Locale = DEFAULT_LOCALE,
): DietaryInfo[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((k) => {
      const e = DIETARY_MAP[k];
      return e
        ? { key: k, icon: e.icon, label: e.labels[locale] ?? e.labels.en }
        : { key: k, icon: "•", label: pretty(k) };
    });
}

export const KNOWN_DIETARY: DietaryInfo[] = Object.entries(DIETARY_MAP).map(
  ([key, e]) => ({ key, icon: e.icon, label: e.labels.en }),
);
