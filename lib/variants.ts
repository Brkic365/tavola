// Portion-size variants live in Dish.variants as JSON:
//   [{ label: "Mala", price: 14, weightG: 250 }, ...]
// Labels are operator text in the restaurant's own language (like base names).

export type DishVariant = {
  label: string;
  price: number;
  weightG?: number | null;
};

/** Safe-parse the stored JSON into a clean variant list (drops junk rows). */
export function parseVariants(raw: unknown): DishVariant[] {
  if (!Array.isArray(raw)) return [];
  const out: DishVariant[] = [];
  for (const v of raw) {
    if (!v || typeof v !== "object") continue;
    const { label, price, weightG } = v as Record<string, unknown>;
    if (typeof label !== "string" || !label.trim()) continue;
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0)
      continue;
    out.push({
      label: label.trim(),
      price,
      weightG:
        typeof weightG === "number" && Number.isFinite(weightG) && weightG > 0
          ? Math.round(weightG)
          : null,
    });
  }
  return out;
}

/** Lowest variant price — the "from €X" display value. */
export function minVariantPrice(variants: DishVariant[]): number | null {
  if (variants.length === 0) return null;
  return Math.min(...variants.map((v) => v.price));
}
