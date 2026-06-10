// Guest menu light/dark mode. The choice is stored in a cookie so the server
// can render the right palette on first paint (no flash of the wrong theme).

export const THEME_COOKIE = "tavola_theme";
export type ThemeMode = "light" | "dark";

export function isThemeMode(v: unknown): v is ThemeMode {
  return v === "light" || v === "dark";
}
