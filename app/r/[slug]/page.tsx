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
        <div className="mx-auto w-full max-w-2xl px-5 py-10 text-center">
          {restaurant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logoUrl}
              alt={restaurant.name}
              className="mx-auto mb-4 h-16 w-16 rounded-full object-cover ring-2 ring-white/40"
            />
          )}
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/70">
            Menu
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight">
            {restaurant.name}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {totalDishes} dishes · tap any dish to view it life-size
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm">
            📐 See real portions in AR before you order
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-5">
        {groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
            This menu has no dishes yet.
          </p>
        ) : (
          <div className="space-y-12">
            {groups.map((group) => (
              <section key={group.key}>
                {/* classic menu section header with side rules */}
                <div className="mb-5 flex items-center gap-4">
                  <span className="h-px flex-1 bg-stone-300/70" />
                  <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-800">
                    {group.name}
                  </h2>
                  <span className="h-px flex-1 bg-stone-300/70" />
                </div>
                <ul className="divide-y divide-stone-200/80 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
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
        Powered by <span className="font-serif">Tavola</span> · true-to-scale AR
        menus
      </footer>
    </div>
  );
}
