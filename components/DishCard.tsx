import Link from "next/link";
import DishThumb from "@/components/DishThumb";
import { formatPrice, formatDimensions, formatWeight } from "@/lib/format";
import { parseAllergens } from "@/lib/allergens";

type DishCardProps = {
  slug: string;
  currency: string;
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
    featured: boolean;
  };
};

export default function DishCard({ slug, currency, dish }: DishCardProps) {
  const dims = formatDimensions(dish.widthCm, dish.depthCm, dish.heightCm);
  const weight = formatWeight(dish.weightG);
  const allergens = parseAllergens(dish.allergens);

  return (
    <Link
      href={`/r/${slug}/dish/${dish.id}`}
      className="group flex gap-4 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:border-teal-300 hover:shadow-md"
    >
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl">
        <DishThumb name={dish.name} seed={dish.id} thumbnailUrl={dish.thumbnailUrl} />
        {dish.featured && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow">
            ★ Chef&apos;s pick
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-stone-900">{dish.name}</h3>
          <span className="shrink-0 font-semibold text-stone-900">
            {formatPrice(dish.price, currency)}
          </span>
        </div>

        {dish.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">
            {dish.description}
          </p>
        )}

        {/* Portion transparency, right on the card — the Tavola hero value. */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          {dish.serves && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800">
              👥 serves {dish.serves}
            </span>
          )}
          {dims && (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
              📐 {dims}
            </span>
          )}
          {weight && (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
              ⚖️ {weight}
            </span>
          )}
          {allergens.length > 0 && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
              title={allergens.map((a) => a.label).join(", ")}
            >
              {allergens.map((a) => (
                <span key={a.key} aria-hidden>
                  {a.icon}
                </span>
              ))}
            </span>
          )}
        </div>

        <span className="mt-2 text-sm font-medium text-brand">
          View in AR →
        </span>
      </div>
    </Link>
  );
}
