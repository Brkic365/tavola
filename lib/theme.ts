import type { CSSProperties } from "react";

const DEFAULT_BRAND = "#0f766e"; // teal-700

/** Validate a stored hex colour so user input can't inject arbitrary CSS. */
export function sanitizeHex(value?: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  const withHash = v.startsWith("#") ? v : `#${v}`;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(withHash)
    ? withHash
    : null;
}

/**
 * Inline style that sets the `--brand` CSS variable for a subtree, enabling the
 * .bg-brand / .text-brand helpers to follow each restaurant's brandColor.
 */
export function brandStyle(brandColor?: string | null): CSSProperties {
  const color = sanitizeHex(brandColor) ?? DEFAULT_BRAND;
  return { "--brand": color } as CSSProperties;
}
