// Weekly opening hours, stored in Restaurant.openingHours as JSON:
//   [{ open: "09:00", close: "23:00" } | null, ...]  — 7 entries, Monday first.
// null = closed. A close earlier than open runs past midnight.

export type DayHours = { open: string; close: string } | null;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DAY_KEYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

/** Safe-parse the stored JSON; null when nothing usable is set. */
export function parseHours(raw: unknown): DayHours[] | null {
  if (!Array.isArray(raw) || raw.length !== 7) return null;
  const days = raw.map((d): DayHours => {
    const { open, close } = (d ?? {}) as Record<string, unknown>;
    return typeof open === "string" && typeof close === "string" &&
      TIME.test(open) && TIME.test(close) && open !== close
      ? { open, close }
      : null;
  });
  return days.some(Boolean) ? days : null;
}

/** Read the admin form's open_0..6 / close_0..6 time inputs. */
export function hoursFromForm(formData: FormData): DayHours[] | null {
  return parseHours(
    DAY_KEYS.map((_, i) => ({
      open: String(formData.get(`open_${i}`) ?? ""),
      close: String(formData.get(`close_${i}`) ?? ""),
    })),
  );
}

const mins = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

/**
 * Is the restaurant open at `now` (read in the viewer's local clock — a guest
 * scanning the table QR is in the restaurant's time zone)?
 */
export function isOpenAt(days: DayHours[], now: Date): boolean {
  const today = (now.getDay() + 6) % 7; // JS Sunday=0 → Monday-first index
  const yesterday = (today + 6) % 7;
  const t = now.getHours() * 60 + now.getMinutes();
  const d = days[today];
  if (d) {
    const o = mins(d.open), c = mins(d.close);
    if (c > o ? t >= o && t < c : t >= o) return true;
  }
  // Yesterday's late shift still running after midnight.
  const y = days[yesterday];
  return !!y && mins(y.close) < mins(y.open) && t < mins(y.close);
}

// Self-check: `npx tsx lib/hours.ts`
if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("hours.ts")) {
  const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
  const week: DayHours[] = Array(7).fill({ open: "12:00", close: "23:00" });
  week[0] = null; // closed Mondays
  week[5] = { open: "18:00", close: "02:00" }; // Saturday past midnight
  assert(parseHours(week)?.[0] === null, "keeps closed day");
  assert(parseHours(Array(7).fill(null)) === null, "all closed → null");
  assert(parseHours([{ open: "25:00", close: "1" }, ...Array(6).fill(null)]) === null, "junk");
  // 2026-10-20 is a Tuesday.
  assert(isOpenAt(week, new Date(2026, 9, 20, 13, 0)), "tue lunch open");
  assert(!isOpenAt(week, new Date(2026, 9, 20, 23, 0)), "tue 23:00 closed");
  assert(!isOpenAt(week, new Date(2026, 9, 19, 13, 0)), "monday closed");
  assert(isOpenAt(week, new Date(2026, 9, 25, 1, 0)), "sat shift into sunday 01:00");
  assert(!isOpenAt(week, new Date(2026, 9, 25, 3, 0)), "sunday 03:00 closed");
  const fd = new FormData();
  fd.set("open_1", "09:00"); fd.set("close_1", "17:00");
  assert(JSON.stringify(hoursFromForm(fd)?.[1]) === '{"open":"09:00","close":"17:00"}', "form");
  console.log("hours ok");
}
