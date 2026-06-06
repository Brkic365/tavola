// Small presentation helpers shared across the menu, dish, and admin views.

export function formatPrice(price: number, currency = "EUR"): string {
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency,
    }).format(price);
  } catch {
    // Fallback if an unknown currency code sneaks in.
    return `${price.toFixed(2)} ${currency}`;
  }
}

/** "24 × 18 × 6 cm" — only the provided dimensions are shown. */
export function formatDimensions(
  widthCm?: number | null,
  depthCm?: number | null,
  heightCm?: number | null,
): string | null {
  const parts = [widthCm, depthCm, heightCm]
    .filter((v): v is number => typeof v === "number" && v > 0)
    .map((v) => trimNumber(v));
  if (parts.length === 0) return null;
  return `${parts.join(" × ")} cm`;
}

/** "320 g" below 1000 g, "1.2 kg" above. */
export function formatWeight(weightG?: number | null): string | null {
  if (!weightG || weightG <= 0) return null;
  if (weightG >= 1000) return `${trimNumber(weightG / 1000)} kg`;
  return `${weightG} g`;
}

function trimNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
