"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Check, ArrowUp, type LucideIcon } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

type Verdict = "smaller" | "as_expected" | "bigger";

const OPTIONS: Array<{
  verdict: Verdict;
  Icon: LucideIcon;
  labelKey: "fbSmaller" | "fbAsExpected" | "fbBigger";
}> = [
  { verdict: "smaller", Icon: ArrowDown, labelKey: "fbSmaller" },
  { verdict: "as_expected", Icon: Check, labelKey: "fbAsExpected" },
  { verdict: "bigger", Icon: ArrowUp, labelKey: "fbBigger" },
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
      className="rounded-2xl border border-hair surface-2 px-4 py-3"
    >
      {voted ? (
        <p className="inline-flex items-center gap-1.5 text-sm text-soft">
          <Check
            className="h-4 w-4"
            strokeWidth={2}
            style={{ color: "var(--olive)" }}
          />
          {t(locale, "fbThanks")}
        </p>
      ) : (
        <>
          <p className="text-sm font-medium text-soft">
            {t(locale, "portionQuestion")}
          </p>
          <div className="mt-2 flex gap-2">
            {OPTIONS.map((o) => (
              <button
                key={o.verdict}
                type="button"
                onClick={() => vote(o.verdict)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-hair surface px-2 py-2 text-sm font-medium text-soft transition hover:border-[var(--brand)] hover:bg-brand-soft hover:text-strong"
              >
                <o.Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                {t(locale, o.labelKey)}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
