import { formatDimensions, formatWeight } from "@/lib/format";

type Props = {
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  weightG: number | null;
  serves: string | null;
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
}: Props) {
  const dims = formatDimensions(widthCm, depthCm, heightCm);
  const weight = formatWeight(weightG);

  const hasAny = dims || weight || serves;
  if (!hasAny) return null;

  return (
    <section className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal-800">
        📐 Real portion size
      </h2>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="Size" value={dims ?? "—"} hint="W × D × H" />
        <Stat label="Weight" value={weight ?? "—"} />
        <Stat label="Serves" value={serves ?? "—"} />
      </div>

      {(widthCm || depthCm || heightCm) && (
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-teal-100 pt-3 text-center">
          <Dim label="Width" cm={widthCm} />
          <Dim label="Depth" cm={depthCm} />
          <Dim label="Height" cm={heightCm} />
        </dl>
      )}

      <p className="mt-3 text-xs text-teal-700/80">
        Shown life-size in AR — what you see is the real size on your table.
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
