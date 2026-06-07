// Allergens are stored as a comma-separated string on Dish.allergens.
// This maps known keys to a localized label + emoji icon for the menu.

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export type AllergenInfo = { key: string; label: string; icon: string };

type Labels = Record<Locale, string>;

const ALLERGEN_MAP: Record<string, { icon: string; labels: Labels }> = {
  gluten: { icon: "🌾", labels: { en: "Gluten", hr: "Gluten", de: "Gluten", it: "Glutine" } },
  shellfish: { icon: "🦐", labels: { en: "Shellfish", hr: "Školjkaši", de: "Schalentiere", it: "Frutti di mare" } },
  crustaceans: { icon: "🦀", labels: { en: "Crustaceans", hr: "Rakovi", de: "Krebstiere", it: "Crostacei" } },
  fish: { icon: "🐟", labels: { en: "Fish", hr: "Riba", de: "Fisch", it: "Pesce" } },
  molluscs: { icon: "🦑", labels: { en: "Molluscs", hr: "Mekušci", de: "Weichtiere", it: "Molluschi" } },
  dairy: { icon: "🥛", labels: { en: "Dairy", hr: "Mlijeko", de: "Milch", it: "Latticini" } },
  eggs: { icon: "🥚", labels: { en: "Eggs", hr: "Jaja", de: "Eier", it: "Uova" } },
  nuts: { icon: "🥜", labels: { en: "Nuts", hr: "Orašasti plodovi", de: "Nüsse", it: "Frutta a guscio" } },
  soy: { icon: "🫘", labels: { en: "Soy", hr: "Soja", de: "Soja", it: "Soia" } },
  sesame: { icon: "◦", labels: { en: "Sesame", hr: "Sezam", de: "Sesam", it: "Sesamo" } },
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Parse the stored comma-separated allergens into localized entries. */
export function parseAllergens(
  raw?: string | null,
  locale: Locale = DEFAULT_LOCALE,
): AllergenInfo[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((k) => {
      const e = ALLERGEN_MAP[k];
      return e
        ? { key: k, icon: e.icon, label: e.labels[locale] ?? e.labels.en }
        : { key: k, icon: "•", label: cap(k) };
    });
}

export const KNOWN_ALLERGENS: AllergenInfo[] = Object.entries(ALLERGEN_MAP).map(
  ([key, e]) => ({ key, icon: e.icon, label: e.labels.en }),
);
