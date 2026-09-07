"use client";

import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/**
 * Locale toggles that set the cookie and re-render the server components.
 * Text codes, not flag emoji — flags don't render on Windows and codes read
 * cleaner in the editorial style.
 */
export default function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();

  function choose(code: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 rounded-full bg-white/15 p-1"
    >
      {LOCALES.map((l) => {
        const active = l.code === current;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => choose(l.code)}
            aria-pressed={active}
            title={l.label}
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition ${
              active
                ? "bg-white/95 text-stone-900 shadow"
                : "text-white/75 hover:text-white"
            }`}
          >
            <span aria-hidden>{l.code}</span>
            <span className="sr-only">{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
