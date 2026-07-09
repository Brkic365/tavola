// "Size at a glance" — compares the dish's footprint to everyday objects so a
// guest gets instant portion intuition without launching AR. All bars share one
// cm scale, so relative size is obvious.

import {
  CreditCard,
  Smartphone,
  Hand,
  UtensilsCrossed,
  Ruler,
  type LucideIcon,
} from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

type Ref = {
  key: string;
  tkey: "refCard" | "refPhone" | "refHand" | "refPlate";
  Icon: LucideIcon;
  cm: number;
};

const REFERENCES: Ref[] = [
  { key: "card", tkey: "refCard", Icon: CreditCard, cm: 8.5 },
  { key: "phone", tkey: "refPhone", Icon: Smartphone, cm: 15 },
  { key: "hand", tkey: "refHand", Icon: Hand, cm: 18 },
  { key: "plate", tkey: "refPlate", Icon: UtensilsCrossed, cm: 27 },
];

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export default function PortionScale({
  widthCm,
  depthCm,
  locale,
}: {
  widthCm: number | null;
  depthCm: number | null;
  locale: Locale;
}) {
  // Footprint = the larger horizontal dimension (how much table it takes).
  const footprint = Math.max(widthCm ?? 0, depthCm ?? 0);
  if (footprint <= 0) return null;

  const rows = [
    {
      key: "dish",
      label: t(locale, "thisDish"),
      Icon: Ruler,
      cm: footprint,
      dish: true,
    },
    ...REFERENCES.map((r) => ({
      key: r.key,
      label: t(locale, r.tkey),
      Icon: r.Icon,
      cm: r.cm,
      dish: false,
    })),
  ].sort((a, b) => a.cm - b.cm);

  const maxCm = Math.max(...rows.map((r) => r.cm));

  return (
    <section className="rounded-2xl border border-hair surface p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-soft">
        {t(locale, "sizeAtGlance")}
      </h2>
      <p className="mt-1 text-xs text-soft">
        {t(locale, "footprintVs")} ({trim(footprint)} cm)
      </p>

      <ul className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3">
            <span
              className={`flex w-28 shrink-0 items-center gap-2 text-xs ${
                r.dish ? "font-semibold text-strong" : "text-soft"
              }`}
            >
              <r.Icon
                className="h-3.5 w-3.5 shrink-0"
                strokeWidth={1.75}
                style={r.dish ? { color: "var(--brand)" } : undefined}
                aria-hidden
              />
              {r.label}
            </span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full surface-2">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.max(4, (r.cm / maxCm) * 100)}%`,
                  backgroundColor: r.dish
                    ? "var(--brand)"
                    : "color-mix(in srgb, var(--foreground) 20%, transparent)",
                }}
              />
            </span>
            <span
              className={`w-12 shrink-0 text-right text-xs tabular-nums ${
                r.dish ? "font-semibold text-strong" : "text-soft"
              }`}
            >
              {trim(r.cm)} cm
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
