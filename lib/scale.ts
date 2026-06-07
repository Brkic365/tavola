// True-to-scale verification: compare the operator-STATED dish dimensions against
// the MEASURED bounding box of the GLB (model-viewer.getDimensions() × 100).
// When they agree, the dish is genuinely shown at real size in AR.

export type Dims = {
  w: number | null | undefined;
  d: number | null | undefined;
  h: number | null | undefined;
};

export type ScaleStatus = "verified" | "mismatch" | "unknown";

// Per-axis tolerance: the larger of 2 cm or 20% — generous enough for honest
// rounding / authoring, tight enough to catch a placeholder model.
function axisTolerance(cm: number): number {
  return Math.max(2, cm * 0.2);
}

function axisMatches(stated: number, model: number): boolean {
  return Math.abs(stated - model) <= axisTolerance(Math.max(stated, model));
}

/**
 * "verified"  — every axis we can compare agrees within tolerance
 * "mismatch"  — we can compare at least one axis and it disagrees
 * "unknown"   — not enough data (no model measurement, or no stated dims)
 */
export function scaleStatus(stated: Dims, model: Dims): ScaleStatus {
  const pairs: Array<[number | null | undefined, number | null | undefined]> = [
    [stated.w, model.w],
    [stated.d, model.d],
    [stated.h, model.h],
  ];

  const comparable = pairs.filter(
    ([s, m]) =>
      typeof s === "number" && s > 0 && typeof m === "number" && m > 0,
  ) as Array<[number, number]>;

  if (comparable.length === 0) return "unknown";
  return comparable.every(([s, m]) => axisMatches(s, m))
    ? "verified"
    : "mismatch";
}
