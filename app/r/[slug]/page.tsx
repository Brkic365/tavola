import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { brandStyle } from "@/lib/theme";
import DishCard from "@/components/DishCard";

type Params = { params: Promise<{ slug: string }> };

async function getRestaurant(slug: string) {
  return prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          dishes: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
        },
      },
      // Dishes with no category — shown under an "Other" group.
      dishes: {
        where: { categoryId: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) return { title: "Menu not found · Tavola" };
  return {
    title: `${restaurant.name} · Menu`,
    description: `See every dish life-size in AR before you order at ${restaurant.name}.`,
  };
}

export default async function MenuPage({ params }: Params) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();

  const groups = [
    ...restaurant.categories.map((c) => ({
      key: c.id,
      name: c.name,
      dishes: c.dishes,
    })),
    ...(restaurant.dishes.length > 0
      ? [{ key: "uncategorized", name: "Other", dishes: restaurant.dishes }]
      : []),
  ].filter((g) => g.dishes.length > 0);

  const totalDishes = groups.reduce((n, g) => n + g.dishes.length, 0);

  return (
    <div style={brandStyle(restaurant.brandColor)} className="flex flex-1 flex-col">
      <header className="bg-brand text-white">
        <div className="mx-auto w-full max-w-2xl px-5 py-8">
          <div className="flex items-center gap-3">
            {restaurant.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white/40"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {restaurant.name}
              </h1>
              <p className="text-sm text-white/80">
                {totalDishes} dishes · tap any dish to view it life-size
              </p>
            </div>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm">
            📐 See real portions in AR before you order
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-6">
        {groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
            This menu has no dishes yet.
          </p>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.key}>
                <h2 className="mb-3 text-lg font-semibold text-stone-800">
                  {group.name}
                </h2>
                <ul className="space-y-3">
                  {group.dishes.map((dish) => (
                    <li key={dish.id}>
                      <DishCard
                        slug={restaurant.slug}
                        currency={restaurant.currency}
                        dish={dish}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="mx-auto w-full max-w-2xl px-5 py-8 text-center text-xs text-stone-400">
        Powered by Tavola · true-to-scale AR menus
      </footer>
    </div>
  );
}
