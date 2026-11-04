import Link from "next/link";
import { Star, Box } from "lucide-react";
import DishThumb from "@/components/DishThumb";
import { formatPrice, formatWeight } from "@/lib/format";
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
  /** The "add to my table" control, rendered in the card's action row. */
  action?: React.ReactNode;
};

/**
 * One dish on the guest menu. Big photo of the real scan, name and price you
 * can read at arm's length, one plain line of portion facts, and a single
 * obvious button into the 3D view.
 */
export default function DishCard({
  slug,
  currency,
  locale,
  dish,
  action,
}: DishCardProps) {
  const weight = formatWeight(dish.weightG);
  const allergens = parseAllergens(dish.allergens, locale);
  const dietary = parseDietary(dish.dietary, locale);
  const soldOut = !dish.available;
  const variants = parseVariants(dish.variants);
  const fromPrice = minVariantPrice(variants);
  const href = `/r/${slug}/dish/${dish.id}`;
  const widest = Math.max(dish.widthCm ?? 0, dish.depthCm ?? 0);

  const facts = [
    dish.serves ? `${t(locale, "serves")} ${dish.serves}` : null,
    weight,
    widest > 0 ? `${widest} cm` : null,
    dish.calories != null ? `${dish.calories} kcal` : null,
  ].filter(Boolean);

  return (
    <article
      className={`overflow-hidden rounded-xl border border-hair surface ${
        soldOut ? "opacity-70" : ""
      }`}
    >
      <Link href={href} className="group block" aria-label={dish.name}>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--card-2)]">
          <DishThumb
            name={dish.name}
            seed={dish.id}
            thumbnailUrl={dish.thumbnailUrl}
            className={`transition-transform duration-300 group-hover:scale-[1.02] ${
              soldOut ? "grayscale" : ""
            }`}
          />
          {soldOut ? (
            <span className="absolute left-3 top-3 rounded-md bg-[var(--foreground)] px-2.5 py-1 text-sm font-bold text-[var(--background)]">
              {t(locale, "soldOut")}
            </span>
          ) : (
            dish.featured && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-sm font-bold text-stone-900 shadow-sm">
                <Star
                  className="h-3.5 w-3.5 fill-current text-brand"
                  strokeWidth={0}
                  aria-hidden
                />
                {t(locale, "chefsPick")}
              </span>
            )
          )}
        </div>

        <div className="px-4 pt-3.5">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-[1.45rem] font-bold leading-tight text-strong">
              {dish.name}
            </h3>
            <span className="shrink-0 pt-0.5 font-display text-[1.35rem] font-bold tabular-nums text-strong">
              {fromPrice !== null ? (
                <>
                  <span className="mr-1 text-sm font-normal text-soft">
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
            <p className="mt-1 line-clamp-2 text-[0.95rem] leading-snug text-soft">
              {dish.description}
            </p>
          )}

          {(facts.length > 0 || allergens.length > 0 || dietary.length > 0) && (
            <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-strong">
              {facts.length > 0 && <span>{facts.join("  ·  ")}</span>}
              {dietary.map((d) => {
                const Icon = dietaryIcon(d.key);
                return (
                  <span
                    key={d.key}
                    className="inline-flex items-center gap-1 font-semibold"
                    style={{ color: "var(--olive)" }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                    {d.label}
                  </span>
                );
              })}
              {allergens.length > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-soft"
                  title={allergens.map((a) => a.label).join(", ")}
                >
                  <span className="sr-only">
                    {t(locale, "allergens")}:{" "}
                    {allergens.map((a) => a.label).join(", ")}
                  </span>
                  {allergens.map((a) => {
                    const Icon = allergenIcon(a.key);
                    return (
                      <Icon
                        key={a.key}
                        className="h-4 w-4"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    );
                  })}
                </span>
              )}
            </p>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-2 px-4 pb-4 pt-3.5">
        <Link
          href={href}
          className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-base font-bold transition active:scale-[0.98] ${
            soldOut
              ? "border border-hair text-strong"
              : "bg-brand text-white hover:brightness-110"
          }`}
        >
          <Box className="h-5 w-5" strokeWidth={2} aria-hidden />
          {t(locale, "seeIn3d")}
        </Link>
        {action}
      </div>
    </article>
  );
}
