// Dietary attributes are stored as a comma-separated string on Dish.dietary
// (positive attributes a guest can filter the menu by).

export type DietaryInfo = { key: string; label: string; icon: string };

const DIETARY_MAP: Record<string, DietaryInfo> = {
  vegetarian: { key: "vegetarian", label: "Vegetarian", icon: "🥬" },
  vegan: { key: "vegan", label: "Vegan", icon: "🌿" },
  "gluten-free": { key: "gluten-free", label: "Gluten-free", icon: "🌾" },
  "dairy-free": { key: "dairy-free", label: "Dairy-free", icon: "🥛" },
  pescatarian: { key: "pescatarian", label: "Pescatarian", icon: "🐟" },
  "nut-free": { key: "nut-free", label: "Nut-free", icon: "🥜" },
  halal: { key: "halal", label: "Halal", icon: "☪️" },
  spicy: { key: "spicy", label: "Spicy", icon: "🌶️" },
};

export function parseDietary(raw?: string | null): DietaryInfo[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map(
      (k) =>
        DIETARY_MAP[k] ?? {
          key: k,
          label: k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, " "),
          icon: "•",
        },
    );
}

export const KNOWN_DIETARY = Object.values(DIETARY_MAP);
