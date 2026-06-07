import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "@/lib/i18n";

/** Resolve the active locale from an optional override, else the cookie. */
export async function getLocale(override?: string): Promise<Locale> {
  if (isLocale(override)) return override;
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(c) ? c : DEFAULT_LOCALE;
}
