// "Size at a glance" — compares the dish's footprint to everyday objects so a
// guest gets instant portion intuition without launching AR. All bars share one
// cm scale, so relative size is obvious.

type Ref = { key: string; label: string; icon: string; cm: number };

const REFERENCES: Ref[] = [
  { key: "card", label: "Credit card", icon: "💳", cm: 8.5 },
  { key: "phone", label: "Smartphone", icon: "📱", cm: 15 },
  { key: "hand", label: "Hand span", icon: "🖐", cm: 18 },
  { key: "plate", label: "Dinner plate", icon: "🍽️", cm: 27 },
];

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export default function PortionScale({
  widthCm,
  depthCm,
}: {
  widthCm: number | null;
  depthCm: number | null;
}) {
  // Footprint = the larger horizontal dimension (how much table it takes).
  const footprint = Math.max(widthCm ?? 0, depthCm ?? 0);
  if (footprint <= 0) return null;

  const rows = [
    { key: "dish", label: "This dish", icon: "📐", cm: footprint, dish: true },
    ...REFERENCES.map((r) => ({ ...r, dish: false })),
  ].sort((a, b) => a.cm - b.cm);

  const maxCm = Math.max(...rows.map((r) => r.cm));

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Size at a glance
      </h2>
      <p className="mt-0.5 text-xs text-stone-400">
        Footprint vs everyday objects ({trim(footprint)} cm across)
      </p>

      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3">
            <span
              className={`flex w-28 shrink-0 items-center gap-1.5 text-xs ${
                r.dish ? "font-semibold text-stone-900" : "text-stone-500"
              }`}
            >
              <span aria-hidden>{r.icon}</span>
              {r.label}
            </span>
            <span className="h-3 flex-1 overflow-hidden rounded-full bg-stone-100">
              <span
                className={`block h-full rounded-full ${
                  r.dish ? "bg-brand" : "bg-stone-300"
                }`}
                style={{ width: `${Math.max(4, (r.cm / maxCm) * 100)}%` }}
              />
            </span>
            <span
              className={`w-12 shrink-0 text-right text-xs tabular-nums ${
                r.dish ? "font-semibold text-stone-900" : "text-stone-400"
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
