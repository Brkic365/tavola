import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "@/lib/i18n";

/**
 * Resolve the active locale: explicit override → guest's cookie → the
 * restaurant's default → the app default.
 */
export async function getLocale(
  override?: string | null,
  fallback?: string | null,
): Promise<Locale> {
  if (isLocale(override)) return override;
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  if (isLocale(fallback)) return fallback;
  return DEFAULT_LOCALE;
}
