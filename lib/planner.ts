// Table portion planner: does what the table picked actually feed the party?
// Sums each dish's stated "serves" (e.g. "1-2") as a [min, max] range.

export type PlannerItem = {
  qty: number;
  serves: string | null;
  weightG: number | null;
  calories: number | null;
  price: number;
};

/** "2" → [2,2], "1-2" / "1–2" → [1,2], "3+" → [3,3]. Junk → null. */
export function parseServes(raw: string | null): [number, number] | null {
  const nums = (raw ?? "").match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length === 0 || nums[0] <= 0) return null;
  const min = nums[0];
  const max = nums.length > 1 ? Math.max(min, nums[1]) : min;
  return [min, max];
}

export type Verdict = "short" | "right" | "plenty" | "unknown";

export function summarize(items: PlannerItem[], party: number) {
  let min = 0, max = 0, weightG = 0, calories = 0, price = 0, dishes = 0;
  let unknownServes = 0;
  for (const it of items) {
    if (it.qty <= 0) continue;
    dishes += it.qty;
    price += it.price * it.qty;
    weightG += (it.weightG ?? 0) * it.qty;
    calories += (it.calories ?? 0) * it.qty;
    const s = parseServes(it.serves);
    if (s) {
      min += s[0] * it.qty;
      max += s[1] * it.qty;
    } else unknownServes += it.qty;
  }
  // Dishes without a "serves" value can't be judged; only call it when we know.
  let verdict: Verdict = "unknown";
  if (dishes > 0 && unknownServes < dishes) {
    if (max < party) verdict = unknownServes ? "unknown" : "short";
    else if (min > party * 1.5) verdict = "plenty";
    else verdict = "right";
  }
  return { dishes, servesMin: min, servesMax: max, weightG, calories, price, verdict, unknownServes };
}

// Self-check: `npx tsx lib/planner.ts`
if (typeof process !== "undefined" && process.argv[1]?.endsWith("planner.ts")) {
  const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
  assert(JSON.stringify(parseServes("1-2")) === "[1,2]", "range");
  assert(JSON.stringify(parseServes("2")) === "[2,2]", "single");
  assert(parseServes("") === null && parseServes(null) === null, "empty");
  const item = (serves: string | null, qty = 1) => ({ qty, serves, weightG: 300, calories: 500, price: 10 });
  assert(summarize([item("1")], 4).verdict === "short", "short");
  assert(summarize([item("1-2", 2)], 3).verdict === "right", "right");
  assert(summarize([item("4", 2)], 2).verdict === "plenty", "plenty");
  assert(summarize([item(null)], 2).verdict === "unknown", "unknown");
  const s = summarize([item("1", 3)], 3);
  assert(s.weightG === 900 && s.price === 30 && s.calories === 1500, "totals");
  console.log("planner ok");
}
