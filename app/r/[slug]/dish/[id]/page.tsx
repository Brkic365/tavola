import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { brandStyle } from "@/lib/theme";
import { formatPrice, formatDimensions, formatWeight } from "@/lib/format";
import { parseAllergens } from "@/lib/allergens";
import ModelViewer from "@/components/ModelViewer";
import PortionPanel from "@/components/PortionPanel";

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
  const dims = formatDimensions(dish.widthCm, dish.depthCm, dish.heightCm);
  const weight = formatWeight(dish.weightG);
  const allergens = parseAllergens(dish.allergens);

  // Caption shown right under the AR viewer so portion info is visible even
  // without launching AR.
  const captionParts = [
    dims,
    weight,
    dish.serves ? `serves ${dish.serves}` : null,
  ].filter(Boolean);

  return (
    <div
      style={brandStyle(restaurant.brandColor)}
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4"
    >
      <Link
        href={`/r/${slug}`}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-stone-800"
      >
        ← {restaurant.name}
      </Link>

      {/* 3D + AR viewer (client component). True-to-scale via ar-scale="fixed". */}
      <ModelViewer
        src={dish.glbUrl}
        iosSrc={dish.usdzUrl}
        alt={`3D model of ${dish.name}`}
        dishId={dish.id}
      />

      {captionParts.length > 0 && (
        <p className="mt-2 text-center text-xs text-stone-500">
          {captionParts.join(" · ")} — tap{" "}
          <span className="font-medium text-stone-700">
            “View in your space”
          </span>{" "}
          to see it life-size
        </p>
      )}

      <div className="mt-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              {dish.name}
            </h1>
            {dish.serves && (
              <p className="mt-1 text-sm text-stone-500">
                Serves {dish.serves}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xl font-bold text-stone-900">
            {formatPrice(dish.price, restaurant.currency)}
          </span>
        </div>

        {dish.description && (
          <p className="leading-relaxed text-stone-600">{dish.description}</p>
        )}

        <PortionPanel
          widthCm={dish.widthCm}
          depthCm={dish.depthCm}
          heightCm={dish.heightCm}
          weightG={dish.weightG}
          serves={dish.serves}
        />

        {allergens.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Allergens
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {allergens.map((a) => (
                <li
                  key={a.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700"
                >
                  <span aria-hidden>{a.icon}</span>
                  {a.label}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
