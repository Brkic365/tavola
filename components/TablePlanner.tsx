"use client";

import { useState } from "react";
import { Minus, Plus, Users, ChevronUp, ChevronDown } from "lucide-react";
import { formatPrice, formatWeight } from "@/lib/format";
import { summarize } from "@/lib/planner";
import { t, type Locale } from "@/lib/i18n";
import type { MenuDish } from "@/components/MenuBrowser";

/**
 * Sticky "My table" bar: what the table has picked, and whether it feeds the
 * party (summed "serves" vs people eating). No ordering — show it to the waiter.
 */
export default function TablePlanner({
  dishes,
  picks,
  setQty,
  party,
  setParty,
  currency,
  locale,
}: {
  dishes: MenuDish[];
  picks: Record<string, number>;
  setQty: (id: string, qty: number) => void;
  party: number;
  setParty: (n: number) => void;
  currency: string;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const rows = dishes
    .filter((d) => (picks[d.id] ?? 0) > 0)
    .map((d) => ({ dish: d, qty: picks[d.id] }));
  if (rows.length === 0) return null;

  const s = summarize(
    rows.map(({ dish, qty }) => ({ qty, ...dish })),
    party,
  );
  const range =
    s.servesMin === s.servesMax ? `${s.servesMin}` : `${s.servesMin}–${s.servesMax}`;
  const verdictKey = {
    short: "verdictShort",
    right: "verdictRight",
    plenty: "verdictPlenty",
    unknown: "verdictUnknown",
  } as const;
  const tone =
    s.verdict === "right"
      ? "var(--olive)"
      : s.verdict === "unknown"
        ? "var(--muted)"
        : "rgb(225 29 72)";

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-5">
      <section
        aria-label={t(locale, "myTable")}
        className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-hair surface shadow-lg"
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">
            {s.dishes}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-base font-semibold text-strong">
              {t(locale, "myTable")}
            </span>
            <span className="block truncate text-xs text-soft">
              {s.servesMax > 0 && (
                <>
                  {t(locale, "feeds")} {range} ·{" "}
                </>
              )}
              {formatWeight(s.weightG) ?? ""}
              {s.calories > 0 && ` · ${s.calories} kcal`}
            </span>
          </span>
          <span className="font-serif text-lg font-semibold text-strong">
            {formatPrice(s.price, currency)}
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4 text-soft" aria-hidden />
          ) : (
            <ChevronUp className="h-4 w-4 text-soft" aria-hidden />
          )}
        </button>

        <p
          className="border-t border-hair px-4 py-2 text-sm font-medium"
          style={{ color: tone }}
          aria-live="polite"
        >
          {t(locale, verdictKey[s.verdict])}
        </p>

        {open && (
          <div className="max-h-[50vh] overflow-y-auto border-t border-hair px-4 py-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-strong">
                <Users className="h-4 w-4 text-soft" strokeWidth={1.75} aria-hidden />
                {t(locale, "people")}
              </span>
              <Stepper
                value={party}
                onChange={(n) => setParty(Math.max(1, Math.min(30, n)))}
                locale={locale}
                label={t(locale, "people")}
              />
            </div>
            <ul className="divide-y divide-[var(--hairline)]">
              {rows.map(({ dish, qty }) => (
                <li key={dish.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-strong">
                      {dish.name}
                    </span>
                    {dish.serves && (
                      <span className="text-xs text-soft">
                        {t(locale, "serves")} {dish.serves}
                      </span>
                    )}
                  </span>
                  <Stepper
                    value={qty}
                    onChange={(n) => setQty(dish.id, n)}
                    locale={locale}
                    label={dish.name}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-hair pt-3 text-xs text-soft">
              <span>{t(locale, "showWaiter")}</span>
              <button
                type="button"
                onClick={() => rows.forEach(({ dish }) => setQty(dish.id, 0))}
                className="font-medium text-brand hover:underline"
              >
                {t(locale, "clearTable")}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stepper({
  value,
  onChange,
  locale,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  locale: Locale;
  label: string;
}) {
  const btn =
    "flex h-7 w-7 items-center justify-center rounded-full surface-2 text-strong ring-1 ring-[var(--hairline)] hover:bg-[var(--hairline)]";
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        aria-label={`${t(locale, "removeOne")}: ${label}`}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <span className="w-5 text-center text-sm font-semibold text-strong" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        aria-label={`${t(locale, "addOne")}: ${label}`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </span>
  );
}
