"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { isOpenAt, type DayHours } from "@/lib/hours";
import { t, type Locale } from "@/lib/i18n";

/** Weekly hours + a live "open now" line (guest's clock = restaurant's clock). */
export default function OpeningHours({ days, locale }: { days: DayHours[]; locale: Locale }) {
  // Time-dependent, so decided after mount to keep SSR/hydration identical.
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const tick = () => setOpen(isOpenAt(days, new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [days]);

  // 2024-01-01 was a Monday → localized short weekday names, Monday first.
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const names = days.map((_, i) => fmt.format(new Date(2024, 0, 1 + i)));

  return (
    <div className="mb-4 flex flex-col items-center gap-2 text-sm text-soft">
      <p className="inline-flex items-center gap-1.5 font-medium text-strong">
        <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        {t(locale, "openingHours")}
        {open !== null && (
          <span
            className="ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{
              color: open ? "var(--olive)" : "rgb(225 29 72)",
              backgroundColor: open ? "color-mix(in srgb, var(--olive) 12%, transparent)" : "rgb(225 29 72 / 0.1)",
            }}
          >
            {t(locale, open ? "openNow" : "closedNow")}
          </span>
        )}
      </p>
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-xs">
        {days.map((d, i) => (
          <div key={i} className="contents">
            <dt className="text-left capitalize">{names[i]}</dt>
            <dd className="text-right tabular-nums">
              {d ? `${d.open}–${d.close}` : t(locale, "closed")}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
