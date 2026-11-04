import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Scale, Flame } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { brandStyle } from "@/lib/theme";
import { formatPrice, formatDimensions, formatWeight } from "@/lib/format";
import { parseAllergens } from "@/lib/allergens";
import { parseDietary } from "@/lib/dietary";
import { allergenIcon, dietaryIcon } from "@/lib/glyphs";
import { parseVariants, minVariantPrice } from "@/lib/variants";
import { scaleStatus } from "@/lib/scale";
import { getLocale } from "@/lib/locale";
import { t, localizeContent } from "@/lib/i18n";
import ModelViewer from "@/components/ModelViewer";
import PortionPanel from "@/components/PortionPanel";
import PortionScale from "@/components/PortionScale";
import ViewBeacon from "@/components/ViewBeacon";
import PortionFeedback from "@/components/PortionFeedback";
import TableCapture from "@/components/TableCapture";
import DishThumb from "@/components/DishThumb";
import { libraryUsdz } from "@/lib/bundledModels";
import { scanCreditFor, SCAN_LICENSE } from "@/lib/scanCredits";

type Params = { params: Promise<{ slug: string; id: string }> };

async function getDish(slug: string, id: string) {
  const dish = await prisma.dish.findUnique({
    where: { id },
    include: { restaurant: true },
  });
  // Guard the URL: the dish must belong to the restaurant in the path.
  if (!dish || dish.restaurant.slug !== slug) return null;
  return dish;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, id } = await params;
  const dish = await getDish(slug, id);
  if (!dish) return { title: "Dish not found · Tavola" };
  return {
    title: `${dish.name} · ${dish.restaurant.name}`,
    description: dish.description ?? undefined,
  };
}

export default async function DishPage({ params }: Params) {
  const { slug, id } = await params;
  const dish = await getDish(slug, id);
  if (!dish) notFound();

  const { restaurant } = dish;
  const locale = await getLocale(undefined, restaurant.defaultLocale);
  const content = localizeContent(dish, dish.translations, locale);

  // Sibling dishes (same category, in stock) to keep guests browsing.
  const siblingRows = await prisma.dish.findMany({
    where: {
      restaurantId: restaurant.id,
      categoryId: dish.categoryId,
      available: true,
      id: { not: dish.id },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 6,
  });
  const siblings = siblingRows.map((s) => ({
    id: s.id,
    price: s.price,
    thumbnailUrl: s.thumbnailUrl,
    name: localizeContent(s, s.translations, locale).name,
  }));
  const dims = formatDimensions(dish.widthCm, dish.depthCm, dish.heightCm);
  const weight = formatWeight(dish.weightG);
  const allergens = parseAllergens(dish.allergens, locale);
  const dietary = parseDietary(dish.dietary, locale);
  const variants = parseVariants(dish.variants);
  const fromPrice = minVariantPrice(variants);

  // True-to-scale check: do the stated dimensions match the measured 3D model?
  const verifiedToScale =
    scaleStatus(
      { w: dish.widthCm, d: dish.depthCm, h: dish.heightCm },
      { w: dish.modelWidthCm, d: dish.modelDepthCm, h: dish.modelHeightCm },
    ) === "verified";

  // Caption shown right under the AR viewer so portion info is visible even
  // without launching AR.
  const credit = scanCreditFor(dish.glbUrl);

  const captionParts = [
    dims,
    weight,
    dish.serves ? `${t(locale, "serves")} ${dish.serves}` : null,
    dish.calories != null ? `${dish.calories} kcal` : null,
  ].filter(Boolean);

  return (
    <main
      id="main-content"
      style={brandStyle(restaurant.brandColor)}
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-12 pt-4"
    >
      <ViewBeacon dishId={dish.id} />
      <TableCapture />
      <Link
        href={`/r/${slug}`}
        className="mb-3 inline-flex min-h-12 w-fit items-center gap-2 rounded-lg border border-hair surface px-4 text-base font-bold text-strong transition hover:border-[var(--muted)]"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        {t(locale, "menu")}
      </Link>

      {!dish.available && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">
          <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            {t(locale, "soldOut")}
          </span>
          {t(locale, "soldOutNote")}
        </div>
      )}

      {/* 3D + AR viewer (client component). True-to-scale via ar-scale="fixed". */}
      <ModelViewer
        src={dish.glbUrl}
        iosSrc={dish.usdzUrl ?? libraryUsdz(dish.glbUrl)}
        alt={`3D model of ${content.name}`}
        dishId={dish.id}
        locale={locale}
      />

      <p className="mt-2 text-center text-sm text-soft">
        {t(locale, "dragToTurn")}
      </p>
      {credit && (
        <p className="mt-1 text-center text-xs text-soft">
          {t(locale, "scanCredit")}:{" "}
          <a
            href={credit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {credit.title}
          </a>{" "}
          ·{" "}
          <a
            href={credit.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {credit.author}
          </a>{" "}
          ·{" "}
          <a
            href={SCAN_LICENSE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {SCAN_LICENSE.name}
          </a>
        </p>
      )}

      <div className="mt-5 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[2.1rem] font-extrabold leading-tight tracking-tight text-strong">
              {content.name}
            </h1>
            {captionParts.length > 0 && (
              <p className="mt-1 text-base text-strong">
                {captionParts.join("  ·  ")}
              </p>
            )}
          </div>
          <span className="shrink-0 pt-1 font-display text-[1.9rem] font-extrabold tabular-nums text-strong">
            {fromPrice !== null ? (
              <>
                <span className="mr-1 text-sm font-normal text-soft">
                  {t(locale, "fromPrice")}
                </span>
                {formatPrice(fromPrice, restaurant.currency)}
              </>
            ) : (
              formatPrice(dish.price, restaurant.currency)
            )}
          </span>
        </div>

        {content.description && (
          <p className="text-[1.05rem] leading-relaxed text-strong">
            {content.description}
          </p>
        )}

        {variants.length > 0 && (
          <section
            aria-label={t(locale, "portionOptions")}
            className="rounded-xl border border-hair surface p-4"
          >
            <h2 className="font-display text-xl font-bold text-strong">
              {t(locale, "portionOptions")}
            </h2>
            <ul className="mt-2 divide-y divide-[var(--hairline)]">
              {variants.map((v) => (
                <li
                  key={v.label}
                  className="flex items-baseline justify-between gap-3 py-2"
                >
                  <span className="font-medium text-strong">{v.label}</span>
                  <span className="flex items-baseline gap-3">
                    {v.weightG != null && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-soft">
                        <Scale className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {formatWeight(v.weightG)}
                      </span>
                    )}
                    <span className="font-display text-lg font-semibold text-strong">
                      {formatPrice(v.price, restaurant.currency)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <PortionPanel
          widthCm={dish.widthCm}
          depthCm={dish.depthCm}
          heightCm={dish.heightCm}
          weightG={dish.weightG}
          serves={dish.serves}
          verified={verifiedToScale}
          locale={locale}
        />

        <PortionScale
          widthCm={dish.widthCm}
          depthCm={dish.depthCm}
          locale={locale}
        />

        {(dietary.length > 0 || dish.calories != null) && (
          <section className="flex flex-wrap items-center gap-2">
            {dish.calories != null && (
              <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg surface-2 px-3 text-base text-strong">
                <Flame className="h-4 w-4" strokeWidth={1.75} />
                {dish.calories} {t(locale, "caloriesPerPortion")}
              </span>
            )}
            {dietary.map((d) => {
              const Icon = dietaryIcon(d.key);
              return (
                <span
                  key={d.key}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-hair surface px-3 text-base font-semibold text-strong"
                >
                  <Icon
                    className="h-4 w-4"
                    strokeWidth={1.75}
                    style={{ color: "var(--olive)" }}
                    aria-hidden
                  />
                  {d.label}
                </span>
              );
            })}
          </section>
        )}

        {allergens.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold text-strong">
              {t(locale, "allergens")}
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {allergens.map((a) => {
                const Icon = allergenIcon(a.key);
                return (
                  <li
                    key={a.key}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg surface-2 px-3 text-base text-strong"
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    {a.label}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <PortionFeedback dishId={dish.id} locale={locale} />

        {siblings.length > 0 && (
          <section aria-label={t(locale, "moreDishes")}>
            <h2 className="font-display text-xl font-bold text-strong">
              {t(locale, "moreDishes")}
            </h2>
            <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {siblings.map((s) => (
                <Link
                  key={s.id}
                  href={`/r/${slug}/dish/${s.id}`}
                  className="group flex w-40 shrink-0 flex-col overflow-hidden rounded-xl border border-hair surface transition hover:border-[var(--muted)]"
                >
                  <div className="relative h-24 w-full overflow-hidden">
                    <DishThumb
                      name={s.name}
                      seed={s.id}
                      thumbnailUrl={s.thumbnailUrl}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <span className="line-clamp-2 font-display text-base font-bold leading-snug text-strong">
                      {s.name}
                    </span>
                    <span className="mt-auto text-base text-strong">
                      {formatPrice(s.price, restaurant.currency)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
