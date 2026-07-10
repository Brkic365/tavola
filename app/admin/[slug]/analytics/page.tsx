import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowDown, Check, ArrowUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManageRestaurant } from "@/lib/session";

type Params = { params: Promise<{ slug: string }> };

export const metadata = { title: "Analytics · Tavola" };
export const dynamic = "force-dynamic";

function pct(n: number, d: number): string {
  if (d <= 0) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

export default async function AnalyticsPage({ params }: Params) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      dishes: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { views: true, arViews: true } } },
      },
    },
  });
  if (!restaurant) notFound();
  if (!(await canManageRestaurant(user, restaurant.id))) redirect("/admin");

  const totalViews = restaurant.dishes.reduce((n, d) => n + d._count.views, 0);
  const totalAR = restaurant.dishes.reduce((n, d) => n + d._count.arViews, 0);

  // 7 day-buckets (oldest → newest) in the server's local time.
  const dayMs = 24 * 60 * 60 * 1000;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(startToday.getTime() - (6 - i) * dayMs),
    views: 0,
    ar: 0,
  }));
  const since = days[0].date;

  const [viewRows, arRows] = await Promise.all([
    prisma.dishView.findMany({
      where: { dish: { restaurantId: restaurant.id }, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.arView.findMany({
      where: { dish: { restaurantId: restaurant.id }, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const bucketOf = (ts: Date) => {
    const d = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate());
    return Math.round((d.getTime() - since.getTime()) / dayMs);
  };
  for (const r of viewRows) {
    const i = bucketOf(r.createdAt);
    if (i >= 0 && i < 7) days[i].views++;
  }
  for (const r of arRows) {
    const i = bucketOf(r.createdAt);
    if (i >= 0 && i < 7) days[i].ar++;
  }
  const views7 = days.reduce((n, d) => n + d.views, 0);
  const ar7 = days.reduce((n, d) => n + d.ar, 0);
  const maxDay = Math.max(1, ...days.map((d) => Math.max(d.views, d.ar)));

  // Per-table activity (from per-table QR codes, ?table=N).
  const [tViews, tAr] = await Promise.all([
    prisma.dishView.groupBy({
      by: ["table"],
      where: { dish: { restaurantId: restaurant.id }, table: { not: null } },
      _count: { _all: true },
    }),
    prisma.arView.groupBy({
      by: ["table"],
      where: { dish: { restaurantId: restaurant.id }, table: { not: null } },
      _count: { _all: true },
    }),
  ]);
  const tableMap = new Map<string, { views: number; ar: number }>();
  for (const r of tViews)
    if (r.table)
      tableMap.set(r.table, {
        views: r._count._all,
        ar: tableMap.get(r.table)?.ar ?? 0,
      });
  for (const r of tAr)
    if (r.table)
      tableMap.set(r.table, {
        views: tableMap.get(r.table)?.views ?? 0,
        ar: r._count._all,
      });
  const tableRows = [...tableMap.entries()]
    .map(([table, v]) => ({ table, ...v }))
    .sort(
      (a, b) =>
        Number(a.table) - Number(b.table) ||
        a.table.localeCompare(b.table),
    );

  // Portion-expectation feedback per dish (the outcome signal).
  const fbRows = await prisma.dishFeedback.groupBy({
    by: ["dishId", "verdict"],
    where: { dish: { restaurantId: restaurant.id } },
    _count: { _all: true },
  });
  const fbByDish = new Map<
    string,
    { smaller: number; as_expected: number; bigger: number; total: number }
  >();
  for (const r of fbRows) {
    const e =
      fbByDish.get(r.dishId) ??
      { smaller: 0, as_expected: 0, bigger: 0, total: 0 };
    if (r.verdict === "smaller") e.smaller += r._count._all;
    else if (r.verdict === "bigger") e.bigger += r._count._all;
    else e.as_expected += r._count._all;
    e.total += r._count._all;
    fbByDish.set(r.dishId, e);
  }
  const fbDishes = restaurant.dishes
    .filter((d) => fbByDish.has(d.id))
    .map((d) => ({ name: d.name, ...fbByDish.get(d.id)! }))
    .sort((a, b) => b.total - a.total);

  // Busiest first.
  const rows = [...restaurant.dishes].sort(
    (a, b) => b._count.views - a._count.views || b._count.arViews - a._count.arViews,
  );
  const maxViews = Math.max(1, ...rows.map((d) => d._count.views));

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/admin/${slug}`}
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← Manage {restaurant.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-stone-900">
        Analytics
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        The view → AR-launch funnel. AR rate = how often a dish view leads to a
        life-size AR preview.
      </p>

      {/* top metrics */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Dish views" value={totalViews} hint={`${views7} last 7d`} />
        <Metric label="AR launches" value={totalAR} hint={`${ar7} last 7d`} />
        <Metric label="AR rate" value={pct(totalAR, totalViews)} hint="AR / views" />
        <Metric label="Dishes" value={restaurant.dishes.length} />
      </div>

      {/* 7-day trend */}
      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Last 7 days
          </h2>
          <div className="flex gap-3 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-accent" /> Views
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-amber-500" /> AR
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between gap-2">
          {days.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-24 w-full items-end justify-center gap-1">
                <div
                  className="w-2.5 rounded-t-sm bg-accent"
                  style={{ height: `${(d.views / maxDay) * 100}%` }}
                  title={`${d.views} views`}
                />
                <div
                  className="w-2.5 rounded-t-sm bg-amber-500"
                  style={{ height: `${(d.ar / maxDay) * 100}%` }}
                  title={`${d.ar} AR launches`}
                />
              </div>
              <span className="text-[10px] text-stone-400">
                {d.date.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* per-table activity (only when per-table QR is in use) */}
      {tableRows.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-stone-500">
            By table
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Activity from per-table QR codes — busiest tables first.
          </p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-400">
                  <th className="px-4 py-2 font-semibold">Table</th>
                  <th className="px-3 py-2 text-right font-semibold">Views</th>
                  <th className="px-3 py-2 text-right font-semibold">AR</th>
                  <th className="px-4 py-2 text-right font-semibold">AR rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {tableRows.map((r) => (
                  <tr key={r.table}>
                    <td className="px-4 py-2.5 font-medium text-stone-800">
                      {r.table}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-stone-700">
                      {r.views}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-stone-700">
                      {r.ar}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-accent-strong">
                      {pct(r.ar, r.views)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* per-dish funnel */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-stone-500">
        By dish
      </h2>
      {totalViews + totalAR === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
          No activity yet. Open the menu and a dish to start collecting data.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-400">
                <th className="px-4 py-2 font-semibold">Dish</th>
                <th className="px-3 py-2 text-right font-semibold">Views</th>
                <th className="px-3 py-2 text-right font-semibold">AR</th>
                <th className="px-4 py-2 text-right font-semibold">AR rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-stone-800">{d.name}</div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${Math.round((d._count.views / maxViews) * 100)}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-stone-700">
                    {d._count.views}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-stone-700">
                    {d._count.arViews}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-accent-strong">
                    {pct(d._count.arViews, d._count.views)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* portion-expectation feedback */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Portion expectations
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Guest answers to “does this portion look like what you expected?” — a
        high “smaller” share means the dish oversells its portion.
      </p>
      {fbDishes.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
          No feedback yet — guests answer with one tap on the dish page.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {fbDishes.map((d) => {
            const pctSmaller = Math.round((d.smaller / d.total) * 100);
            const pctOk = Math.round((d.as_expected / d.total) * 100);
            const pctBigger = 100 - pctSmaller - pctOk;
            const oversell = d.total >= 3 && d.smaller / d.total >= 0.5;
            return (
              <div
                key={d.name}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-stone-800">
                    {d.name}
                    {oversell && (
                      <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                        Oversells portion
                      </span>
                    )}
                  </span>
                  <span className="text-xs tabular-nums text-stone-500">
                    {d.total} answers
                  </span>
                </div>
                <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full bg-rose-400"
                    style={{ width: `${pctSmaller}%` }}
                    title={`Smaller: ${d.smaller}`}
                  />
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${pctOk}%` }}
                    title={`As expected: ${d.as_expected}`}
                  />
                  <div
                    className="h-full bg-sky-400"
                    style={{ width: `${pctBigger}%` }}
                    title={`Bigger: ${d.bigger}`}
                  />
                </div>
                <div className="mt-1.5 flex gap-4 text-[11px] text-stone-500">
                  <span className="inline-flex items-center gap-1">
                    <ArrowDown className="h-3 w-3" strokeWidth={2} /> smaller{" "}
                    {d.smaller}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3 w-3" strokeWidth={2} /> as expected{" "}
                    {d.as_expected}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" strokeWidth={2} /> bigger{" "}
                    {d.bigger}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-stone-400">
        First-party data — the kind of measured evidence (does AR/portion clarity
        change behaviour?) competitors only claim. See STRATEGY.md.
      </p>
    </main>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="text-2xl font-bold text-stone-900">{value}</div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-stone-400">{hint}</div>}
    </div>
  );
}
