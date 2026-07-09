import { Ruler, BadgeCheck } from "lucide-react";
import { formatDimensions, formatWeight } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";

type Props = {
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  weightG: number | null;
  serves: string | null;
  // true when the stated dimensions were verified against the 3D model's size
  verified?: boolean;
  locale: Locale;
};

/**
 * The prominent portion panel — Tavola's hero value (portion transparency).
 * Shows real size, weight and "serves N" so guests know exactly how much food
 * they get before ordering, even without launching AR.
 */
export default function PortionPanel({
  widthCm,
  depthCm,
  heightCm,
  weightG,
  serves,
  verified = false,
  locale,
}: Props) {
  const dims = formatDimensions(widthCm, depthCm, heightCm);
  const weight = formatWeight(weightG);

  const hasAny = dims || weight || serves;
  if (!hasAny) return null;

  return (
    <section className="rounded-2xl border border-brand-soft bg-brand-soft p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-brand-strong">
          <Ruler className="h-4 w-4" strokeWidth={1.75} />
          {t(locale, "realPortionSize")}
        </h2>
        {verified && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--olive)" }}
          >
            <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
            {t(locale, "verifiedToScale")}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label={t(locale, "size")} value={dims ?? "—"} hint="W × D × H" />
        <Stat label={t(locale, "weight")} value={weight ?? "—"} />
        <Stat label={t(locale, "serves")} value={serves ?? "—"} />
      </div>

      {(widthCm || depthCm || heightCm) && (
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-brand-soft pt-4 text-center">
          <Dim label={t(locale, "width")} cm={widthCm} />
          <Dim label={t(locale, "depth")} cm={depthCm} />
          <Dim label={t(locale, "height")} cm={heightCm} />
        </dl>
      )}

      <p className="mt-4 text-xs leading-relaxed text-brand-strong/80">
        {t(locale, "lifeSizeNote")}
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl surface px-2 py-3.5 text-center shadow-[0_1px_2px_rgba(36,30,24,0.04)]">
      <div className="font-serif text-lg font-semibold leading-tight text-strong">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-soft">
        {label}
      </div>
      {hint && <div className="text-[10px] text-soft">{hint}</div>}
    </div>
  );
}

function Dim({ label, cm }: { label: string; cm: number | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.08em] text-brand-strong/70">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-strong">
        {cm ? `${cm} cm` : "—"}
      </dd>
    </div>
  );
}
