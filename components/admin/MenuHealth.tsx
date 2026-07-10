import { Check } from "lucide-react";
import { scaleStatus } from "@/lib/scale";

type HealthDish = {
  id: string;
  name: string;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  modelWidthCm: number | null;
  modelDepthCm: number | null;
  modelHeightCm: number | null;
  weightG: number | null;
  serves: string | null;
  usdzUrl: string | null;
  translations: unknown;
};

type Metric = {
  key: string;
  label: string;
  hint: string;
  ok: (d: HealthDish) => boolean;
  /** Whether a non-passing dish is a hard problem (red) vs just incomplete. */
  tone: "scale" | "default";
};

function hasTranslations(t: unknown): boolean {
  return (
    !!t && typeof t === "object" && Object.keys(t as object).length > 0
  );
}

const METRICS: Metric[] = [
  {
    key: "scale",
    label: "Verified to scale",
    hint: "Use “Measure from 3D model” on each dish so its size matches the stated dimensions — this earns the guest-facing “Verified to scale” badge.",
    tone: "scale",
    ok: (d) =>
      scaleStatus(
        { w: d.widthCm, d: d.depthCm, h: d.heightCm },
        { w: d.modelWidthCm, d: d.modelDepthCm, h: d.modelHeightCm },
      ) === "verified",
  },
  {
    key: "ios",
    label: "iOS AR ready",
    hint: "Add a USDZ (“Generate USDZ from GLB”) so iPhone/iPad guests can launch AR.",
    tone: "default",
    ok: (d) => !!d.usdzUrl,
  },
  {
    key: "portion",
    label: "Full portion info",
    hint: "Add width, depth, height, weight and “serves” — the portion-transparency data guests come for.",
    tone: "default",
    ok: (d) =>
      d.widthCm != null &&
      d.depthCm != null &&
      d.heightCm != null &&
      d.weightG != null &&
      !!d.serves,
  },
  {
    key: "translated",
    label: "Translated",
    hint: "Add at least one translation so non-local guests see the dish in their language.",
    tone: "default",
    ok: (d) => hasTranslations(d.translations),
  },
];

/**
 * Admin "menu health" panel — actionable nudges that drive the quality of the
 * guest AR experience (scale verification, iOS AR, portion completeness, i18n).
 */
export default function MenuHealth({ dishes }: { dishes: HealthDish[] }) {
  const n = dishes.length;
  if (n === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Menu health
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        How complete your menu is for the best guest experience.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {METRICS.map((m) => {
          const missing = dishes.filter((d) => !m.ok(d));
          const done = n - missing.length;
          const pct = Math.round((done / n) * 100);
          const complete = missing.length === 0;
          const barColor = complete
            ? "bg-emerald-500"
            : m.tone === "scale"
              ? "bg-amber-500"
              : "bg-accent";

          return (
            <div
              key={m.key}
              className="rounded-xl border border-stone-200 bg-stone-50 p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-800">
                  {complete && (
                    <Check
                      className="h-4 w-4 text-accent-strong"
                      strokeWidth={2}
                    />
                  )}
                  {m.label}
                </span>
                <span className="text-xs font-semibold tabular-nums text-stone-500">
                  {done}/{n}
                </span>
              </div>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {!complete && (
                <details className="group mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-accent-strong hover:underline">
                    {missing.length}{" "}
                    {missing.length === 1 ? "dish needs" : "dishes need"} this
                  </summary>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
                    {m.hint}
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-1">
                    {missing.map((d) => (
                      <li
                        key={d.id}
                        className="rounded-full bg-white px-2 py-0.5 text-[11px] text-stone-600 ring-1 ring-stone-200"
                      >
                        {d.name}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
