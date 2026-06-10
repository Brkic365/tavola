// Per-table tracking: a QR can encode /r/[slug]?table=N. The guest's table is
// stored in this cookie (client-set on landing) and attached to analytics
// events server-side — groundwork for per-table insight and future ordering.

export const TABLE_COOKIE = "tavola_table";

/** Accept only short alphanumeric/dash table ids; null if missing/invalid. */
export function sanitizeTable(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim().slice(0, 24);
  return /^[A-Za-z0-9-]{1,24}$/.test(v) ? v : null;
}
