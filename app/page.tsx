import Link from "next/link";
import {
  QrCode,
  MousePointerClick,
  ScanLine,
  Ruler,
  Scale,
  Box,
  Users,
  Flame,
  Leaf,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Languages,
  BadgeCheck,
  Printer,
  FileSpreadsheet,
  ClipboardCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import Hero3D from "@/components/Hero3D";

// Always reflect current DB state (restaurants change via admin).
export const dynamic = "force-dynamic";

const SECTION = "mx-auto w-full max-w-6xl px-6";

export default async function Home() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { dishes: true } } },
  });
  const primary = restaurants[0];
  const demoHref = primary ? `/r/${primary.slug}` : "/admin";

  return (
    <div className="flex flex-1 flex-col">
      {/* ---- nav ---- */}
      <nav className="sticky top-0 z-20 border-b border-hair bg-[var(--background)]/85 backdrop-blur">
        <div className={`${SECTION} flex items-center justify-between py-4`}>
          <Link href="/" className="flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-semibold tracking-tight text-strong">
              Tavola
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="#how"
              className="hidden text-soft transition-colors hover:text-strong sm:block"
            >
              How it works
            </a>
            <a
              href="#value"
              className="hidden text-soft transition-colors hover:text-strong sm:block"
            >
              Why it matters
            </a>
            <a
              href="#for-restaurants"
              className="text-soft transition-colors hover:text-strong"
            >
              For restaurants
            </a>
            <Link
              href={demoHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-accent-strong"
            >
              Live demo
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ---- hero ---- */}
      <section id="main-content" className={`${SECTION} pt-16 pb-14 md:pt-24`}>
        <div className="grid items-center gap-14 md:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
              <Ruler className="h-3.5 w-3.5" strokeWidth={2} />
              True-to-scale AR menu
            </span>
            <h1 className="mt-6 font-serif text-[2.75rem] font-semibold leading-[1.04] tracking-tight text-strong sm:text-6xl">
              See every dish at its{" "}
              <em className="italic text-accent">real</em> size — before you
              order.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-soft">
              Guests scan the table QR, tap a dish, and it appears in AR at true
              real-world scale — with honest dimensions, weight and
              &ldquo;serves&nbsp;N.&rdquo; No more &ldquo;the photo looked
              bigger.&rdquo;
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={demoHref}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-strong"
              >
                See the demo menu
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-hair surface px-6 py-3 text-sm font-semibold text-strong transition-colors hover:border-[var(--muted)]"
              >
                I run a restaurant
              </Link>
            </div>
            <p className="mt-6 text-sm text-soft">
              No app to install · works from any phone camera.
            </p>
          </div>

          {/* live 3D showpiece */}
          <div className="animate-rise-late relative">
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(60%_60%_at_50%_35%,var(--accent-soft),transparent)]"
            />
            <figure className="overflow-hidden rounded-[2rem] border border-hair surface shadow-[0_30px_60px_-25px_rgba(36,30,24,0.35)]">
              <div className="surface-2">
                <Hero3D src="/models/avocado.glb" alt="A 3D avocado, rotating" />
              </div>
              <figcaption className="flex items-center justify-between gap-3 border-t border-hair px-5 py-3.5">
                <span className="font-serif text-sm font-medium text-strong">
                  Shown life-size in AR
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
                  <ScanLine className="h-3 w-3" strokeWidth={2} /> To scale
                </span>
              </figcaption>
            </figure>
            <p className="mt-3 text-center text-xs text-soft">
              Drag to rotate · on a phone, tap &ldquo;View in your space.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ---- what every dish shows (hairline strip) ---- */}
      <div className="border-y border-hair">
        <div
          className={`${SECTION} flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 text-sm text-soft`}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-soft">
            Every dish shows
          </span>
          <span className="inline-flex items-center gap-2">
            <Ruler className="h-4 w-4 text-accent" strokeWidth={1.75} />
            Dimensions
          </span>
          <span className="inline-flex items-center gap-2">
            <Scale className="h-4 w-4 text-accent" strokeWidth={1.75} />
            Weight
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" strokeWidth={1.75} />
            Serves
          </span>
          <span className="inline-flex items-center gap-2">
            <Flame className="h-4 w-4 text-accent" strokeWidth={1.75} />
            Calories
          </span>
          <span className="inline-flex items-center gap-2">
            <Leaf className="h-4 w-4 text-accent" strokeWidth={1.75} />
            Allergens
          </span>
        </div>
      </div>

      {/* ---- how it works ---- */}
      <section id="how" className={`${SECTION} py-20`}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-strong">
            How it works
          </p>
          <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-strong">
            From table QR to life-size, in three taps.
          </h2>
        </div>
        <ol className="mt-14 grid gap-10 sm:grid-cols-3">
          {[
            {
              Icon: QrCode,
              title: "Scan the QR",
              body: "Each table has its own QR. Guests scan to open the menu — nothing to install.",
            },
            {
              Icon: MousePointerClick,
              title: "Tap a dish",
              body: "Browse by category and open any dish to see it in 3D with real portion details.",
            },
            {
              Icon: ScanLine,
              title: "View it life-size",
              body: "“View in your space” drops the dish onto the real table at true 1:1 scale.",
            },
          ].map((s, i) => (
            <li key={s.title} className="relative">
              <span className="font-serif text-5xl font-semibold text-[var(--hairline)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="mt-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                <s.Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 font-serif text-xl font-semibold text-strong">
                {s.title}
              </h3>
              <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-soft">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- value ---- */}
      <section id="value" className="border-y border-hair surface-2">
        <div className={`${SECTION} py-20`}>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-strong">
              Why it matters
            </p>
            <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-strong">
              Portion transparency, not just a party trick.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-soft">
              The point isn&apos;t the AR novelty — it&apos;s helping guests
              order with confidence and cutting &ldquo;that&apos;s smaller than
              I expected&rdquo; complaints.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {[
              {
                Icon: Ruler,
                title: "Real dimensions",
                body: "Width × depth × height in centimetres, shown on every dish and verified against the 3D model.",
              },
              {
                Icon: Scale,
                title: "Weight & serves",
                body: "Know the gram weight and how many people a plate actually feeds before it arrives.",
              },
              {
                Icon: Box,
                title: "True-to-scale AR",
                body: "Models placed at 1:1 on your table — what you see is exactly what the kitchen sends out.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-hair surface p-7 shadow-[0_1px_0_rgba(36,30,24,0.03)]"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                  <f.Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="mt-5 font-serif text-xl font-semibold text-strong">
                  {f.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-soft">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- credibility stat ---- */}
      <section className="bg-[var(--foreground)] text-[var(--background)]">
        <div className={`${SECTION} py-20 text-center`}>
          <p className="mx-auto max-w-3xl font-serif text-3xl font-medium leading-snug tracking-tight sm:text-[2.5rem]">
            <span className="text-accent">48%</span> of diners have left food
            because the portion was too big — and half want clearer portion
            information before they order.
          </p>
          <p className="mx-auto mt-6 max-w-md text-sm text-[var(--background)]/60">
            Tavola turns that guesswork into something they can see at real
            scale — the honest signal a photo can&apos;t give.
          </p>
        </div>
      </section>

      {/* ---- for restaurants (the buyer) ---- */}
      <section id="for-restaurants" className={`${SECTION} py-20`}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-strong">
            For restaurants
          </p>
          <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-strong">
            A menu tool, not just a party trick.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-soft">
            Behind the guest experience is a full menu dashboard — built for a
            busy service, not for a software manual.
          </p>
        </div>
        <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              Icon: BarChart3,
              title: "Analytics that prove it",
              body: "See which dishes guests view and place in AR — per table — and hear directly whether portions matched expectations.",
            },
            {
              Icon: Languages,
              title: "Four languages built in",
              body: "English, Croatian, German and Italian out of the box, with your own default. Made for a tourist dining room.",
            },
            {
              Icon: BadgeCheck,
              title: "“Verified to scale” is earned",
              body: "Stated dimensions are checked against the actual 3D model. The trust badge only appears when they match.",
            },
            {
              Icon: Printer,
              title: "Table cards in one click",
              body: "Print-ready, numbered QR cards for every table — branded with your logo and colour.",
            },
            {
              Icon: FileSpreadsheet,
              title: "Your menu, in a spreadsheet",
              body: "Export the whole menu as CSV, edit it in Excel, import it back. Sold-out, prices, sizes — all bulk-editable.",
            },
            {
              Icon: ClipboardCheck,
              title: "Menu health at a glance",
              body: "A checklist that shows exactly which dishes still need sizes, translations or an iOS model — and how to fix them.",
            },
          ].map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                <f.Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-strong">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-soft">
                  {f.body}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-14 flex max-w-2xl flex-col items-center gap-4 rounded-3xl border border-hair surface p-8 text-center shadow-sm sm:flex-row sm:text-left">
          <div className="flex-1">
            <h3 className="font-serif text-2xl font-semibold text-strong">
              Pilot it free.
            </h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-soft">
              We set up your first dishes, print the table cards, and run it
              for a month. If your guests don&apos;t love it, take it off the
              tables — nothing lost.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-strong"
          >
            Start with your menu
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>

      {/* ---- live demo ---- */}
      <section className="border-t border-hair surface-2">
        <div className={`${SECTION} py-20`}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-strong">
            Try it now
          </p>
          <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-strong">
            Open a live menu.
          </h2>
        </div>
        {restaurants.length === 0 ? (
          <p className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-hair p-6 text-center text-soft">
            No restaurants yet — run{" "}
            <code className="rounded surface-2 px-1.5 py-0.5 text-sm">
              npm run db:seed
            </code>
            .
          </p>
        ) : (
          <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
            {restaurants.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/r/${r.slug}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-hair surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
                >
                  <div>
                    <p className="font-serif text-xl font-semibold text-strong">
                      {r.name}
                    </p>
                    <p className="mt-0.5 text-sm text-soft">
                      /r/{r.slug} · {r._count.dishes} dishes
                    </p>
                  </div>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong transition-colors group-hover:bg-accent group-hover:text-white">
                    <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        </div>
      </section>

      {/* ---- closing CTA ---- */}
      <section className="border-t border-hair bg-accent-soft">
        <div className={`${SECTION} py-16 text-center`}>
          <h2 className="font-serif text-4xl font-semibold tracking-tight text-strong">
            Put your menu on the table.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-soft">
            Set up a restaurant, add your dishes, print the table QR — guests are
            viewing dishes to scale in minutes.
          </p>
          <Link
            href="/admin"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-strong"
          >
            Get started
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>

      {/* ---- footer ---- */}
      <footer className="border-t border-hair">
        <div
          className={`${SECTION} flex flex-col items-center justify-between gap-3 py-8 text-sm text-soft sm:flex-row`}
        >
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-lg font-semibold text-strong">
              Tavola
            </span>
            <span className="h-1 w-1 rounded-full bg-accent" />
            <span className="ml-1.5">true-to-scale AR menus</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href={demoHref} className="hover:text-strong">
              Live demo
            </Link>
            <Link href="/admin" className="hover:text-strong">
              Restaurant admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
