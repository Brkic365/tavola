// schema.org structured data for the public menu — lets search engines show
// rich menu results (Restaurant → Menu → MenuSection → MenuItem).

import { parseDietary } from "@/lib/dietary";
import { parseVariants, minVariantPrice } from "@/lib/variants";

// schema.org/RestrictedDiet values we can map our dietary tags onto.
const DIET_SCHEMA: Record<string, string> = {
  vegetarian: "https://schema.org/VegetarianDiet",
  vegan: "https://schema.org/VeganDiet",
  "gluten-free": "https://schema.org/GlutenFreeDiet",
  "dairy-free": "https://schema.org/LowLactoseDiet",
  halal: "https://schema.org/HalalDiet",
  kosher: "https://schema.org/KosherDiet",
};

type JsonLdDish = {
  name: string;
  description: string | null;
  price: number;
  calories: number | null;
  dietary: string | null;
  available: boolean;
  variants?: unknown;
};

type JsonLdGroup = {
  name: string;
  description?: string | null;
  dishes: JsonLdDish[];
};

export function menuJsonLd(
  restaurant: {
    name: string;
    currency: string;
    address: string | null;
    phone: string | null;
    website: string | null;
  },
  groups: JsonLdGroup[],
  menuUrl: string,
): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    url: restaurant.website ?? menuUrl,
    ...(restaurant.address ? { address: restaurant.address } : {}),
    ...(restaurant.phone ? { telephone: restaurant.phone } : {}),
    hasMenu: {
      "@type": "Menu",
      url: menuUrl,
      hasMenuSection: groups.map((g) => ({
        "@type": "MenuSection",
        name: g.name,
        ...(g.description ? { description: g.description } : {}),
        hasMenuItem: g.dishes
          .filter((d) => d.available)
          .map((d) => {
            const fromPrice = minVariantPrice(parseVariants(d.variants));
            const diets = parseDietary(d.dietary)
              .map((t) => DIET_SCHEMA[t.key])
              .filter(Boolean);
            return {
              "@type": "MenuItem",
              name: d.name,
              ...(d.description ? { description: d.description } : {}),
              offers: {
                "@type": "Offer",
                price: (fromPrice ?? d.price).toFixed(2),
                priceCurrency: restaurant.currency,
              },
              ...(d.calories != null
                ? {
                    nutrition: {
                      "@type": "NutritionInformation",
                      calories: `${d.calories} calories`,
                    },
                  }
                : {}),
              ...(diets.length ? { suitableForDiet: diets } : {}),
            };
          }),
      })),
    },
  };
  // Escape "<" so operator-entered text can't close the <script> tag.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
