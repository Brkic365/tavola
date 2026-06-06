// Allergens are stored as a comma-separated string on Dish.allergens.
// This maps known keys to a short label + emoji icon for the menu cards.

export type AllergenInfo = { key: string; label: string; icon: string };

const ALLERGEN_MAP: Record<string, AllergenInfo> = {
  gluten: { key: "gluten", label: "Gluten", icon: "🌾" },
  shellfish: { key: "shellfish", label: "Shellfish", icon: "🦐" },
  crustaceans: { key: "crustaceans", label: "Crustaceans", icon: "🦀" },
  fish: { key: "fish", label: "Fish", icon: "🐟" },
  molluscs: { key: "molluscs", label: "Molluscs", icon: "🦑" },
  dairy: { key: "dairy", label: "Dairy", icon: "🥛" },
  eggs: { key: "eggs", label: "Eggs", icon: "🥚" },
  nuts: { key: "nuts", label: "Nuts", icon: "🥜" },
  soy: { key: "soy", label: "Soy", icon: "🫘" },
  sesame: { key: "sesame", label: "Sesame", icon: "◦" },
};

/** Parse the stored comma-separated allergens into known + unknown entries. */
export function parseAllergens(raw?: string | null): AllergenInfo[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map(
      (k) =>
        ALLERGEN_MAP[k] ?? {
          key: k,
          label: k.charAt(0).toUpperCase() + k.slice(1),
          icon: "•",
        },
    );
}

export const KNOWN_ALLERGENS = Object.values(ALLERGEN_MAP);
