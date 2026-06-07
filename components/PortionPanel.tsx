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
    <section className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal-800">
          📐 {t(locale, "realPortionSize")}
        </h2>
        {verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-700 px-2.5 py-1 text-xs font-semibold text-white">
            ✓ {t(locale, "verifiedToScale")}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat label={t(locale, "size")} value={dims ?? "—"} hint="W × D × H" />
        <Stat label={t(locale, "weight")} value={weight ?? "—"} />
        <Stat label={t(locale, "serves")} value={serves ?? "—"} />
      </div>

      {(widthCm || depthCm || heightCm) && (
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-teal-100 pt-3 text-center">
          <Dim label={t(locale, "width")} cm={widthCm} />
          <Dim label={t(locale, "depth")} cm={depthCm} />
          <Dim label={t(locale, "height")} cm={heightCm} />
        </dl>
      )}

      <p className="mt-3 text-xs text-teal-700/80">
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
    <div className="rounded-xl bg-white px-2 py-3 text-center shadow-sm">
      <div className="text-base font-bold leading-tight text-stone-900">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-stone-500">
        {label}
      </div>
      {hint && <div className="text-[10px] text-stone-400">{hint}</div>}
    </div>
  );
}

function Dim({ label, cm }: { label: string; cm: number | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-teal-700/70">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-stone-800">
        {cm ? `${cm} cm` : "—"}
      </dd>
    </div>
  );
}
