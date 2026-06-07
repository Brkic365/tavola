import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

export const metadata = { title: "Analytics · Tavola" };
export const dynamic = "force-dynamic";

function pct(n: number, d: number): string {
  if (d <= 0) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

export default async function AnalyticsPage({ params }: Params) {
  const { slug } = await params;

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

  const totalViews = restaurant.dishes.reduce((n, d) => n + d._count.views, 0);
  const totalAR = restaurant.dishes.reduce((n, d) => n + d._count.arViews, 0);

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [views7, ar7] = await Promise.all([
    prisma.dishView.count({
      where: { dish: { restaurantId: restaurant.id }, createdAt: { gte: since } },
    }),
    prisma.arView.count({
      where: { dish: { restaurantId: restaurant.id }, createdAt: { gte: since } },
    }),
  ]);

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
                        className="h-full rounded-full bg-teal-500"
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
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-teal-700">
                    {pct(d._count.arViews, d._count.views)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
