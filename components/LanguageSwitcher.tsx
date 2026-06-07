"use client";

import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/** Flag toggles that set the locale cookie and re-render the server components. */
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
      className="inline-flex items-center gap-1 rounded-full bg-white/15 p-1"
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
            className={`rounded-full px-2 py-0.5 text-sm transition ${
              active ? "bg-white/90 shadow" : "opacity-70 hover:opacity-100"
            }`}
          >
            <span aria-hidden>{l.flag}</span>
            <span className="sr-only">{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
