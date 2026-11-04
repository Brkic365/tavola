import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { Check, ArrowRight, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatWeight } from "@/lib/format";
import Hero3D from "@/components/Hero3D";

// Always reflect current DB state (restaurants change via admin).
export const dynamic = "force-dynamic";

const WRAP = "mx-auto w-full max-w-6xl px-4 sm:px-8";

const OWNER_POINTS = [
  "We scan your real dishes and set up the menu for you.",
  "Numbered QR cards for every table, ready to print.",
  "English, Croatian, German and Italian built in.",
  "Mark a dish sold out or change a price in seconds.",
  "See which dishes guests look at, table by table.",
  "Guests tell you if a portion matched what they expected.",
];

export default async function Home() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, slug: true, name: true, currency: true },
  });
  const demo =
    restaurants.find((r) => r.slug === "tavola-demo") ?? restaurants[0];
  const demoHref = demo ? `/r/${demo.slug}` : "/admin";

  const dishes = demo
    ? await prisma.dish.findMany({
        where: { restaurantId: demo.id, thumbnailUrl: { not: null } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        take: 6,
      })
    : [];
  const currency = demo?.currency ?? "EUR";

  // The dish shown in the hero phones: the black risotto when present.
  const heroDish =
    dishes.find((d) => d.glbUrl.includes("crni-rizot")) ?? dishes[0] ?? null;
  const heroGlb = heroDish?.glbUrl ?? "/models/dishes/crni-rizot.glb";
  const heroName = heroDish?.name ?? "Crni rižot";
  const heroWidth = Math.max(heroDish?.widthCm ?? 0, heroDish?.depthCm ?? 0);
  const otherDish = dishes.find((d) => d.id !== heroDish?.id) ?? null;

  // QR so someone on a laptop can open the demo on their phone.
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
  const qrSvg = await QRCode.toString(`${origin}${demoHref}`, {
    type: "svg",
    margin: 0,
    color: { dark: "#171614", light: "#ffffff" },
  });

  return (
    <div className="flex flex-1 flex-col bg-white text-[#171614]">
      {/* ---- nav ---- */}
      <nav className={`${WRAP} flex items-center justify-between py-5`}>
        <Link
          href="/"
          className="font-display text-2xl font-black tracking-tight"
        >
          tavola
        </Link>
        <div className="flex items-center gap-2 text-base sm:gap-6">
          <a href="#how" className="hidden hover:underline sm:block">
            How it works
          </a>
          <a href="#restaurants" className="hidden hover:underline sm:block">
            For restaurants
          </a>
          <Link
            href={demoHref}
            className="inline-flex min-h-11 items-center rounded-lg bg-[#0f766e] px-4 font-bold text-white hover:bg-[#0c5f59]"
          >
            Open the demo
          </Link>
        </div>
      </nav>

      {/* ---- hero ---- */}
      <section
        id="main-content"
        className={`${WRAP} grid items-center gap-12 pb-20 pt-6 md:grid-cols-[1.05fr_0.95fr] md:pt-12`}
      >
        <div>
          <h1 className="font-display text-[3.2rem] font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.4rem]">
            See the dish before you order it.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-[#55524c]">
            Every dish on your menu becomes a 3D scan of the real food. Guests
            scan the QR code on the table, tap a dish, and see it sitting on
            their own table through the phone camera, at its real size.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={demoHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#0f766e] px-6 text-base font-bold text-white hover:bg-[#0c5f59]"
            >
              Try the demo menu
              <ArrowRight className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </Link>
            <a
              href="#restaurants"
              className="inline-flex min-h-12 items-center rounded-lg border-[1.5px] border-[#cfccc4] px-6 text-base font-bold hover:border-[#171614]"
            >
              I own a restaurant
            </a>
          </div>
          <div className="mt-8 hidden max-w-sm items-center gap-4 rounded-xl border-[1.5px] border-[#e2dfd8] p-3 md:flex">
            <span
              className="block h-20 w-20 shrink-0 [&>svg]:h-full [&>svg]:w-full"
              role="img"
              aria-label="QR code that opens the demo menu"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="text-[0.95rem] leading-snug text-[#3d3b37]">
              <b>On a computer?</b>
              <br />
              Scan this with your phone to open the demo menu, just like a
              guest would.
            </p>
          </div>
        </div>

        {/* Two phones: the menu, then the dish on the table. */}
        <div
          className="relative mx-auto h-[540px] w-full max-w-[460px] sm:h-[600px]"
          aria-label={`A phone showing the menu, and a second phone showing ${heroName} on a real table through the camera`}
          role="img"
        >
          <div className="absolute left-0 top-10 w-[56%] max-w-[250px] -rotate-[4deg] rounded-[34px] bg-[#171614] p-2.5 shadow-[0_30px_50px_-25px_rgba(0,0,0,0.45)]">
            <div className="flex aspect-[9/18.5] flex-col gap-2.5 overflow-hidden rounded-[26px] bg-[#f4f3ef] px-3 py-4">
              <span className="font-display text-xl font-extrabold leading-none">
                {demo?.name ?? "Konoba Tavola"}
              </span>
              <span className="rounded-lg bg-[#dcefec] p-2 text-[0.7rem] leading-snug">
                Tap a dish to see it in 3D. On your phone you can put it on the
                table at its real size.
              </span>
              {heroDish && (
                <span className="overflow-hidden rounded-lg border border-[#e1ded7] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroDish.thumbnailUrl ?? ""}
                    alt=""
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <span className="flex justify-between px-2.5 pt-2 font-display text-base font-extrabold">
                    <span>{heroName}</span>
                    <span>{formatPrice(heroDish.price, currency)}</span>
                  </span>
                  <span className="block px-2.5 text-[0.65rem] text-[#5d5a54]">
                    {[
                      heroDish.serves ? `Serves ${heroDish.serves}` : null,
                      formatWeight(heroDish.weightG),
                      heroWidth ? `${heroWidth} cm` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span className="m-2.5 block rounded-md bg-[#0f766e] py-2 text-center text-[0.75rem] font-bold text-white">
                    Put it on my table
                  </span>
                </span>
              )}
              {otherDish && (
                <span className="overflow-hidden rounded-lg border border-[#e1ded7] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={otherDish.thumbnailUrl ?? ""}
                    alt=""
                    className="aspect-[16/10] w-full object-cover"
                  />
                </span>
              )}
            </div>
          </div>

          <span className="absolute left-[42%] top-[40%] z-20 rounded-full bg-[#0f766e] px-3 py-1.5 text-sm font-bold text-white shadow-lg">
            tap →
          </span>

          <div className="absolute right-0 top-0 z-10 w-[58%] max-w-[262px] rounded-[34px] bg-[#171614] p-2.5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.55)]">
            <div
              className="relative aspect-[9/18.5] overflow-hidden rounded-[26px] bg-cover bg-center"
              style={{ backgroundImage: "url(/landing/ar-table.jpg)" }}
            >
              <div className="absolute inset-x-0 bottom-[14%] top-[22%]">
                <Hero3D src={heroGlb} alt={`3D scan of ${heroName}`} />
              </div>
              <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white">
                <X className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              </span>
              <span className="absolute right-3 top-3.5 rounded-full bg-black/55 px-2.5 py-1 text-[0.7rem] font-bold text-white">
                Real size
              </span>
              {heroWidth > 0 && (
                <span className="absolute left-1/2 top-[71%] -translate-x-1/2 rounded-full bg-white px-2.5 py-0.5 font-display text-xs font-extrabold">
                  {heroWidth} cm wide
                </span>
              )}
              <span className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between rounded-xl bg-white/95 px-3 py-2">
                <span>
                  <span className="block font-display text-base font-extrabold leading-tight">
                    {heroName}
                  </span>
                  <span className="block text-[0.65rem] text-[#55524c]">
                    {[
                      heroDish?.serves ? `Serves ${heroDish.serves}` : null,
                      formatWeight(heroDish?.weightG ?? null),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                {heroDish && (
                  <span className="font-display text-lg font-extrabold">
                    {formatPrice(heroDish.price, currency)}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---- real dishes from the demo ---- */}
      {demo && dishes.length > 0 && (
        <section className="border-y border-[#e6e3dc] bg-[#f4f3ef]">
          <div className={`${WRAP} py-16`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="max-w-xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                These are real dishes. Tap one.
              </h2>
              <p className="max-w-sm text-base text-[#55524c]">
                Each one is a 3D scan of real food from our demo restaurant,{" "}
                {demo.name}. Open it on your phone to put it on your table.
              </p>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {dishes.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/r/${demo.slug}/dish/${d.id}`}
                    className="group block overflow-hidden rounded-xl border border-[#e1ded7] bg-white transition hover:border-[#171614]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.thumbnailUrl ?? ""}
                      alt=""
                      className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <span className="flex items-baseline justify-between gap-3 px-3 py-3 sm:px-4">
                      <span className="font-display text-lg font-extrabold leading-tight sm:text-xl">
                        {d.name}
                      </span>
                      <span className="shrink-0 text-base">
                        {formatPrice(d.price, currency)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---- how it works (a real sequence, so it's numbered) ---- */}
      <section id="how" className={`${WRAP} scroll-mt-4 py-20`}>
        <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          How it works for a guest
        </h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            {
              title: "Scan the QR on the table",
              body: "Their phone camera opens the menu. Nothing to install, no account.",
            },
            {
              title: "Tap a dish",
              body: "They see the real food in 3D, with the price, grams and how many people it feeds.",
            },
            {
              title: "Put it on the table",
              body: "One button places the dish on their table through the camera, at its real size.",
            },
          ].map((s, i) => (
            <li key={s.title} className="border-t-[3px] border-[#171614] pt-4">
              <span className="font-display text-lg font-extrabold text-[#0f766e]">
                Step {i + 1}
              </span>
              <h3 className="mt-1 font-display text-2xl font-extrabold leading-tight">
                {s.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-[#55524c]">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- for restaurants ---- */}
      <section
        id="restaurants"
        className="scroll-mt-4 bg-[#171614] text-[#f1f0ec]"
      >
        <div className={`${WRAP} grid gap-12 py-20 md:grid-cols-2`}>
          <div>
            <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              For restaurant owners
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#c9c6be]">
              Fewer &ldquo;it looked bigger in the photo&rdquo; moments, and
              guests who order with confidence, especially tourists reading a
              menu in another language.
            </p>
            <div className="mt-8 rounded-xl border border-[#3a3834] p-5">
              <p className="font-display text-2xl font-extrabold">
                Try it free for a month
              </p>
              <p className="mt-1.5 text-base text-[#c9c6be]">
                We set up your first dishes and print the table cards. If your
                guests don&apos;t like it, take it off the tables.
              </p>
              <Link
                href="/admin/signup"
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-6 text-base font-bold text-[#171614] hover:bg-[#e8e6e0]"
              >
                Start with your menu
                <ArrowRight className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              </Link>
            </div>
          </div>
          <ul className="space-y-4 self-center">
            {OWNER_POINTS.map((p) => (
              <li key={p} className="flex gap-3 text-lg">
                <Check
                  className="mt-1 h-5 w-5 shrink-0 text-[#5fd0c4]"
                  strokeWidth={2.75}
                  aria-hidden
                />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- footer ---- */}
      <footer className={`${WRAP} flex flex-col gap-4 py-8 text-base text-[#55524c] sm:flex-row sm:items-center sm:justify-between`}>
        <span className="font-display text-xl font-black text-[#171614]">
          tavola
        </span>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href={demoHref} className="hover:text-[#171614] hover:underline">
            Demo menu
          </Link>
          <Link href="/admin" className="hover:text-[#171614] hover:underline">
            Restaurant login
          </Link>
          <Link href="/credits" className="hover:text-[#171614] hover:underline">
            3D scan credits
          </Link>
        </div>
      </footer>
    </div>
  );
}
