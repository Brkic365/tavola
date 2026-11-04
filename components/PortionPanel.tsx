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
    <section className="rounded-xl border border-hair surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-strong">
          <Ruler className="h-5 w-5 text-brand" strokeWidth={2} />
          {t(locale, "realPortionSize")}
        </h2>
        {verified && (
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-bold text-white"
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
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-hair pt-4 text-center">
          <Dim label={t(locale, "width")} cm={widthCm} />
          <Dim label={t(locale, "depth")} cm={depthCm} />
          <Dim label={t(locale, "height")} cm={heightCm} />
        </dl>
      )}

      {/* Only claim real size when the model is verified against the dish. */}
      {verified && (
        <p className="mt-4 text-sm leading-relaxed text-soft">
          {t(locale, "lifeSizeNote")}
        </p>
      )}
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
    <div className="rounded-lg surface-2 px-2 py-3 text-center">
      <div className="font-display text-xl font-bold leading-tight text-strong">
        {value}
      </div>
      <div className="mt-1 text-sm text-soft">
        {label}
      </div>
      {hint && <div className="text-xs text-soft">{hint}</div>}
    </div>
  );
}

function Dim({ label, cm }: { label: string; cm: number | null }) {
  return (
    <div>
      <dt className="text-sm text-soft">
        {label}
      </dt>
      <dd className="text-base font-bold text-strong">
        {cm ? `${cm} cm` : "—"}
      </dd>
    </div>
  );
}
