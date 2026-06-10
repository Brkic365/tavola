"use client";

import { useEffect, useState } from "react";
import { t, type Locale } from "@/lib/i18n";

type Verdict = "smaller" | "as_expected" | "bigger";

const OPTIONS: Array<{ verdict: Verdict; icon: string; labelKey: "fbSmaller" | "fbAsExpected" | "fbBigger" }> = [
  { verdict: "smaller", icon: "▼", labelKey: "fbSmaller" },
  { verdict: "as_expected", icon: "✓", labelKey: "fbAsExpected" },
  { verdict: "bigger", icon: "▲", labelKey: "fbBigger" },
];

/**
 * One-tap "was the portion what you expected?" poll — the start of the
 * first-party outcome data (which dishes oversell their portion). Sessionless;
 * localStorage stops the same browser re-voting on a dish.
 */
export default function PortionFeedback({
  dishId,
  locale,
}: {
  dishId: string;
  locale: Locale;
}) {
  const storageKey = `tavola_fb_${dishId}`;
  const [voted, setVoted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setVoted(!!localStorage.getItem(storageKey));
    } catch {
      /* private mode etc. — just allow voting */
    }
    setReady(true);
  }, [storageKey]);

  async function vote(verdict: Verdict) {
    setVoted(true); // optimistic — feedback is best-effort
    try {
      localStorage.setItem(storageKey, verdict);
    } catch {
      /* ignore */
    }
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishId, verdict }),
      });
    } catch {
      /* best-effort */
    }
  }

  // Avoid a hydration flash while localStorage is read.
  if (!ready) return null;

  return (
    <section
      aria-label={t(locale, "portionQuestion")}
      className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
    >
      {voted ? (
        <p className="text-sm text-stone-600">✓ {t(locale, "fbThanks")}</p>
      ) : (
        <>
          <p className="text-sm font-medium text-stone-700">
            {t(locale, "portionQuestion")}
          </p>
          <div className="mt-2 flex gap-2">
            {OPTIONS.map((o) => (
              <button
                key={o.verdict}
                type="button"
                onClick={() => vote(o.verdict)}
                className="flex-1 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm font-medium text-stone-700 transition hover:border-teal-400 hover:bg-teal-50"
              >
                <span aria-hidden className="mr-1 text-xs">
                  {o.icon}
                </span>
                {t(locale, o.labelKey)}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
