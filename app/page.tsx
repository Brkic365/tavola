import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Hero3D from "@/components/Hero3D";

// Always reflect current DB state (restaurants change via admin).
export const dynamic = "force-dynamic";

export default async function Home() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { dishes: true } } },
  });
  const primary = restaurants[0];

  return (
    <div className="flex flex-1 flex-col">
      {/* nav */}
      <nav className="sticky top-0 z-10 border-b border-stone-200/70 bg-stone-50/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
          <span className="font-serif text-xl font-bold tracking-tight text-stone-900">
            Tavola
          </span>
          <div className="flex items-center gap-5 text-sm">
            <a href="#how" className="hidden text-stone-600 hover:text-stone-900 sm:block">
              How it works
            </a>
            {primary && (
              <Link
                href={`/r/${primary.slug}`}
                className="text-stone-600 hover:text-stone-900"
              >
                Live demo
              </Link>
            )}
            <Link
              href="/admin"
              className="rounded-full bg-teal-700 px-4 py-1.5 font-medium text-white hover:bg-teal-800"
            >
              Restaurant admin
            </Link>
          </div>
        </div>
      </nav>

      {/* hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-12 md:grid-cols-2 md:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
            <span>📐</span> True-to-scale AR menu
          </div>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.1] tracking-tight text-stone-900 sm:text-5xl">
            See your dish, life-size, before you order.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-stone-600">
            Tavola turns the table QR into a menu where every dish appears in AR
            at its <em>real</em>&nbsp;size — with true dimensions, weight, and
            &ldquo;serves N&rdquo;. No more &ldquo;the photo looked bigger.&rdquo;
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {primary && (
              <Link
                href={`/r/${primary.slug}`}
                className="rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                View the demo menu →
              </Link>
            )}
            <Link
              href="/admin"
              className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400"
            >
              I run a restaurant
            </Link>
          </div>
        </div>

        {/* live 3D showpiece */}
        <div className="relative">
          <div className="rounded-3xl border border-stone-200 bg-gradient-to-br from-white to-stone-100 p-2 shadow-xl shadow-stone-200/60">
            <div className="overflow-hidden rounded-2xl bg-stone-50">
              <Hero3D src="/models/avocado.glb" alt="A 3D avocado, rotating" />
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-stone-400">
            Drag to rotate · on a phone, tap &ldquo;View in your space&rdquo;
          </p>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="border-y border-stone-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-14">
          <h2 className="text-center font-serif text-3xl font-bold text-stone-900">
            How it works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: "📱",
                title: "Scan the QR",
                body: "Each table has a QR. Guests scan it to open the menu — nothing to install.",
              },
              {
                icon: "🍽️",
                title: "Tap a dish",
                body: "Browse by category and open any dish to see it in 3D with real portion details.",
              },
              {
                icon: "📐",
                title: "View it life-size",
                body: "“View in your space” drops the dish onto the real table at true scale.",
              },
            ].map((s, i) => (
              <div key={s.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-2xl">
                  {s.icon}
                </div>
                <h3 className="mt-4 font-serif text-xl font-semibold text-stone-900">
                  <span className="text-teal-700">{i + 1}.</span> {s.title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-stone-600">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* value */}
      <section className="mx-auto w-full max-w-6xl px-5 py-14">
        <h2 className="text-center font-serif text-3xl font-bold text-stone-900">
          Portion transparency, not just a gimmick
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-stone-600">
          The point isn&apos;t the AR novelty — it&apos;s helping guests order
          with confidence and cutting &ldquo;that&apos;s smaller than I
          expected&rdquo; complaints.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: "📏",
              title: "Real dimensions",
              body: "Width × depth × height in centimetres, shown on every dish.",
            },
            {
              icon: "⚖️",
              title: "Weight & serves",
              body: "Know the gram weight and how many people a plate feeds.",
            },
            {
              icon: "🥑",
              title: "True-to-scale AR",
              body: "Models placed at 1:1 — what you see is exactly what arrives.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-serif text-lg font-semibold text-stone-900">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* live demo */}
      <section className="border-t border-stone-200 bg-stone-100/60">
        <div className="mx-auto w-full max-w-3xl px-5 py-14">
          <h2 className="text-center font-serif text-2xl font-bold text-stone-900">
            Try a live menu
          </h2>
          {restaurants.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-stone-300 p-6 text-center text-stone-500">
              No restaurants yet — run{" "}
              <code className="rounded bg-stone-200 px-1.5 py-0.5 text-sm">
                npm run db:seed
              </code>
              .
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {restaurants.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/r/${r.slug}`}
                    className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
                  >
                    <div>
                      <p className="font-serif text-lg font-semibold text-stone-900">
                        {r.name}
                      </p>
                      <p className="text-sm text-stone-500">
                        /r/{r.slug} · {r._count.dishes} dishes
                      </p>
                    </div>
                    <span className="text-teal-700">Open menu →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-400">
        Tavola · true-to-scale AR menus · MVP demo
      </footer>
    </div>
  );
}
