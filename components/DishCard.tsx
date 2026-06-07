import Link from "next/link";
import DishThumb from "@/components/DishThumb";
import { formatPrice, formatDimensions, formatWeight } from "@/lib/format";
import { parseAllergens } from "@/lib/allergens";
import { parseDietary } from "@/lib/dietary";
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

  return (
    <Link
      href={`/r/${slug}/dish/${dish.id}`}
      aria-disabled={soldOut}
      className={`group flex gap-4 px-4 py-4 transition-colors hover:bg-stone-50 ${
        soldOut ? "opacity-60" : ""
      }`}
    >
      {/* thumbnail with a small 3D/AR affordance */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-stone-200/70">
        <DishThumb name={dish.name} seed={dish.id} thumbnailUrl={dish.thumbnailUrl} />
        {soldOut ? (
          <span className="absolute inset-0 flex items-center justify-center bg-stone-900/55 text-center text-[9px] font-bold uppercase leading-tight tracking-wide text-white">
            {t(locale, "soldOut")}
          </span>
        ) : (
          <span className="absolute bottom-1 right-1 rounded-md bg-stone-900/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            3D · AR
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {soldOut ? (
          <span className="mb-1 inline-flex w-fit items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
            {t(locale, "soldOut")}
          </span>
        ) : (
          dish.featured && (
            <span className="mb-1 inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
              ★ {t(locale, "chefsPick")}
            </span>
          )
        )}
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-lg font-semibold leading-snug text-stone-900">
            {dish.name}
          </h3>
          <span className="shrink-0 font-serif text-lg font-semibold text-stone-900">
            {formatPrice(dish.price, currency)}
          </span>
        </div>

        {dish.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-500">
            {dish.description}
          </p>
        )}

        {/* portion line — the Tavola differentiator, kept understated */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
          {dish.serves && (
            <span>
              👥 {t(locale, "serves")} {dish.serves}
            </span>
          )}
          {dims && <span>📐 {dims}</span>}
          {weight && <span>⚖️ {weight}</span>}
          {dish.calories != null && <span>🔥 {dish.calories} kcal</span>}
          {allergens.length > 0 && (
            <span title={allergens.map((a) => a.label).join(", ")}>
              <span className="sr-only">
                {t(locale, "allergens")}:{" "}
                {allergens.map((a) => a.label).join(", ")}
              </span>
              {allergens.map((a) => (
                <span key={a.key} aria-hidden className="mr-0.5">
                  {a.icon}
                </span>
              ))}
            </span>
          )}
        </div>

        {dietary.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {dietary.map((d) => (
              <span
                key={d.key}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
              >
                <span aria-hidden>{d.icon}</span>
                {d.label}
              </span>
            ))}
          </div>
        )}

        <span className="mt-2 text-sm font-medium text-brand opacity-90 group-hover:opacity-100">
          {t(locale, "viewInAr")} →
        </span>
      </div>
    </Link>
  );
}
