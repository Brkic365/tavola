// Map allergen / dietary keys to line icons (replacing emoji) so the menu reads
// as one consistent icon system. Keys come from parseAllergens / parseDietary.

import {
  Wheat,
  Shell,
  Shrimp,
  Fish,
  Milk,
  Egg,
  Nut,
  Bean,
  Sprout,
  Leaf,
  Vegan,
  Flame,
  BadgeCheck,
  CircleAlert,
  type LucideIcon,
} from "lucide-react";

const ALLERGEN: Record<string, LucideIcon> = {
  gluten: Wheat,
  shellfish: Shell,
  crustaceans: Shrimp,
  fish: Fish,
  molluscs: Shell,
  dairy: Milk,
  eggs: Egg,
  nuts: Nut,
  soy: Bean,
  sesame: Sprout,
};

const DIETARY: Record<string, LucideIcon> = {
  vegetarian: Leaf,
  vegan: Vegan,
  "gluten-free": Wheat,
  "dairy-free": Milk,
  pescatarian: Fish,
  "nut-free": Nut,
  halal: BadgeCheck,
  spicy: Flame,
};

export function allergenIcon(key: string): LucideIcon {
  return ALLERGEN[key] ?? CircleAlert;
}

export function dietaryIcon(key: string): LucideIcon {
  return DIETARY[key] ?? Leaf;
}
