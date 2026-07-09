import Link from "next/link";
import { Star, Users, Ruler, Scale, Flame, ArrowRight } from "lucide-react";
import DishThumb from "@/components/DishThumb";
import { formatPrice, formatDimensions, formatWeight } from "@/lib/format";
import { parseAllergens } from "@/lib/allergens";
import { parseDietary } from "@/lib/dietary";
import { allergenIcon, dietaryIcon } from "@/lib/glyphs";
import { parseVariants, minVariantPrice } from "@/lib/variants";
import { t, type Locale } from "@/lib/i18n";

type DishCardProps = {
  slug: string;
  currency: string;
  locale: Locale;
  dish: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    thumbnailUrl: string | null;
    widthCm: number | null;
    depthCm: number | null;
    heightCm: number | null;
    weightG: number | null;
    serves: string | null;
    allergens: string | null;
    calories: number | null;
    dietary: string | null;
    featured: boolean;
    available: boolean;
    variants?: unknown;
  };
};

/** A single menu entry, styled like a restaurant menu row (not an app card). */
export default function DishCard({
  slug,
  currency,
  locale,
  dish,
}: DishCardProps) {
  const dims = formatDimensions(dish.widthCm, dish.depthCm, dish.heightCm);
  const weight = formatWeight(dish.weightG);
  const allergens = parseAllergens(dish.allergens, locale);
  const dietary = parseDietary(dish.dietary, locale);
  const soldOut = !dish.available;
  const variants = parseVariants(dish.variants);
  const fromPrice = minVariantPrice(variants);

  return (
    <Link
      href={`/r/${slug}/dish/${dish.id}`}
      aria-disabled={soldOut}
      className={`group flex gap-4 px-5 py-5 transition-colors hover:bg-[var(--card-2)] ${
        soldOut ? "opacity-60" : ""
      }`}
    >
      {/* thumbnail with a small 3D/AR affordance */}
      <div className="relative h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-xl ring-1 ring-[var(--hairline)]">
        <DishThumb name={dish.name} seed={dish.id} thumbnailUrl={dish.thumbnailUrl} />
        {soldOut ? (
          <span className="absolute inset-0 flex items-center justify-center bg-[var(--foreground)]/55 text-center text-[9px] font-bold uppercase leading-tight tracking-wide text-[var(--background)]">
            {t(locale, "soldOut")}
          </span>
        ) : (
          <span className="absolute bottom-1 right-1 rounded-md bg-[var(--foreground)]/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[var(--background)]">
            3D · AR
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {soldOut ? (
          <span className="mb-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-rose-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-rose-600">
            {t(locale, "soldOut")}
          </span>
        ) : (
          dish.featured && (
            <span className="mb-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-strong">
              <Star className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
              {t(locale, "chefsPick")}
            </span>
          )
        )}
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-[1.2rem] font-semibold leading-snug text-strong">
            {dish.name}
          </h3>
          <span className="shrink-0 font-serif text-lg font-semibold text-strong">
            {fromPrice !== null ? (
              <>
                <span className="mr-1 text-xs font-normal text-soft">
                  {t(locale, "fromPrice")}
                </span>
                {formatPrice(fromPrice, currency)}
              </>
            ) : (
              formatPrice(dish.price, currency)
            )}
          </span>
        </div>

        {dish.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-soft">
            {dish.description}
          </p>
        )}

        {/* portion line — the Tavola differentiator, kept understated */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-soft">
          {dish.serves && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t(locale, "serves")} {dish.serves}
            </span>
          )}
          {dims && (
            <span className="inline-flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5" strokeWidth={1.75} />
              {dims}
            </span>
          )}
          {weight && (
            <span className="inline-flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5" strokeWidth={1.75} />
              {weight}
            </span>
          )}
          {dish.calories != null && (
            <span className="inline-flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" strokeWidth={1.75} />
              {dish.calories} kcal
            </span>
          )}
          {allergens.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[var(--muted)]">
              <span className="sr-only">
                {t(locale, "allergens")}:{" "}
                {allergens.map((a) => a.label).join(", ")}
              </span>
              {allergens.map((a) => {
                const Icon = allergenIcon(a.key);
                return (
                  <Icon
                    key={a.key}
                    className="h-3.5 w-3.5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                );
              })}
            </span>
          )}
        </div>

        {dietary.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dietary.map((d) => {
              const Icon = dietaryIcon(d.key);
              return (
                <span
                  key={d.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hair surface-2 px-2.5 py-0.5 text-[11px] font-medium text-strong"
                >
                  <Icon
                    className="h-3 w-3"
                    strokeWidth={1.75}
                    style={{ color: "var(--olive)" }}
                    aria-hidden
                  />
                  {d.label}
                </span>
              );
            })}
          </div>
        )}

        <span className="mt-2.5 inline-flex items-center gap-1 text-sm font-medium text-brand opacity-90 transition-opacity group-hover:opacity-100">
          {t(locale, "viewInAr")}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </span>
      </div>
    </Link>
  );
}
