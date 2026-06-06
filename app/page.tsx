import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Always reflect current DB state (restaurants change via admin).
export const dynamic = "force-dynamic";

export default async function Home() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { dishes: true } } },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 py-14">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
          <span>📐</span> True-to-scale AR menu
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900">
          Tavola
        </h1>
        <p className="text-lg leading-relaxed text-stone-600">
          See the dish life-size in front of you before you order. Real
          dimensions, real weight, real portions — so the plate that arrives is
          the plate you expected.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Demo menus
        </h2>
        {restaurants.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 p-6 text-stone-500">
            No restaurants yet. Run{" "}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 text-sm">
              npm run db:seed
            </code>{" "}
            to load the demo.
          </p>
        ) : (
          <ul className="space-y-3">
            {restaurants.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/r/${r.slug}`}
                  className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
                >
                  <div>
                    <p className="font-semibold text-stone-900">{r.name}</p>
                    <p className="text-sm text-stone-500">
                      /r/{r.slug} · {r._count.dishes} dishes
                    </p>
                  </div>
                  <span aria-hidden className="text-teal-700">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-auto border-t border-stone-200 pt-6">
        <Link
          href="/admin"
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          Restaurant admin →
        </Link>
      </section>
    </main>
  );
}
