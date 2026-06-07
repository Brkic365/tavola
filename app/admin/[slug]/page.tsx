import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import {
  createDish,
  updateDish,
  moveDish,
  createCategory,
  updateRestaurant,
  logout,
} from "@/app/admin/actions";
import DishFormFields from "@/components/admin/DishFormFields";
import DeleteDishButton from "@/components/admin/DeleteDishButton";
import CopyLinkButton from "@/components/admin/CopyLinkButton";
import MenuQR from "@/components/admin/MenuQR";
import DishThumb from "@/components/DishThumb";

type Params = { params: Promise<{ slug: string }> };

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";
const labelCls = "block text-sm font-medium text-stone-700";

export default async function ManageRestaurantPage({ params }: Params) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      dishes: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { arViews: true } } },
      },
    },
  });
  if (!restaurant) notFound();

  // Build the absolute public menu URL for the QR code.
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const menuUrl = `${proto}://${host}/r/${slug}`;

  const categories = restaurant.categories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  // Group dishes for display (category order, then an "Uncategorized" bucket).
  const grouped = [
    ...restaurant.categories.map((c) => ({
      key: c.id,
      name: c.name,
      dishes: restaurant.dishes.filter((d) => d.categoryId === c.id),
    })),
    {
      key: "none",
      name: "Uncategorized",
      dishes: restaurant.dishes.filter((d) => d.categoryId === null),
    },
  ].filter((g) => g.dishes.length > 0);

  const totalArViews = restaurant.dishes.reduce(
    (n, d) => n + d._count.arViews,
    0,
  );

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← All restaurants
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href={`/admin/${slug}/analytics`}
            className="font-medium text-stone-500 hover:text-stone-800"
          >
            📊 Analytics
          </Link>
          <Link
            href={`/r/${slug}/menu`}
            target="_blank"
            className="font-medium text-stone-500 hover:text-stone-800"
          >
            Printable menu ↗
          </Link>
          <Link
            href={`/r/${slug}`}
            target="_blank"
            className="font-medium text-teal-700 hover:underline"
          >
            Open public menu ↗
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="font-medium text-stone-500 hover:text-stone-800"
            >
              Log out
            </button>
          </form>
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-stone-900">
        {restaurant.name}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {restaurant.dishes.length} dishes · {totalArViews} AR launches ·{" "}
        {restaurant.currency}
      </p>

      {/* ---- QR + share ---- */}
      <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <MenuQR url={menuUrl} />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Table QR code
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Guests scan this to open the menu. It points to:
          </p>
          <code className="mt-2 block truncate rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">
            {menuUrl}
          </code>
          <div className="mt-2">
            <CopyLinkButton url={menuUrl} />
          </div>
        </div>
      </section>

      {/* ---- restaurant settings ---- */}
      <details className="mt-4 rounded-2xl border border-stone-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-stone-700">
          Restaurant settings & categories
        </summary>
        <div className="grid gap-6 border-t border-stone-100 p-4 md:grid-cols-2">
          <form action={updateRestaurant} className="space-y-3">
            <input type="hidden" name="id" value={restaurant.id} />
            <input type="hidden" name="slug" value={restaurant.slug} />
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Settings
            </p>
            <label className="block">
              <span className={labelCls}>Name</span>
              <input
                name="name"
                defaultValue={restaurant.name}
                className={inputCls}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelCls}>Currency</span>
                <input
                  name="currency"
                  defaultValue={restaurant.currency}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>Brand colour</span>
                <input
                  name="brandColor"
                  type="color"
                  defaultValue={restaurant.brandColor ?? "#0f766e"}
                  className="mt-1 h-[42px] w-full rounded-lg border border-stone-300 px-1"
                />
              </label>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900"
            >
              Save settings
            </button>
          </form>

          <form action={createCategory} className="space-y-3">
            <input type="hidden" name="restaurantId" value={restaurant.id} />
            <input type="hidden" name="slug" value={restaurant.slug} />
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Add category
            </p>
            <label className="block">
              <span className={labelCls}>Category name</span>
              <input
                name="name"
                required
                className={inputCls}
                placeholder="Predjela"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Add category
            </button>
            {categories.length > 0 && (
              <p className="text-xs text-stone-500">
                Current: {categories.map((c) => c.name).join(", ")}
              </p>
            )}
          </form>
        </div>
      </details>

      {/* ---- add dish ---- */}
      <details className="mt-4 rounded-2xl border border-teal-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-teal-800">
          + Add a dish
        </summary>
        <form
          action={createDish}
          className="border-t border-stone-100 p-4"
        >
          <input type="hidden" name="restaurantId" value={restaurant.id} />
          <input type="hidden" name="slug" value={restaurant.slug} />
          <DishFormFields categories={categories} idPrefix="new" />
          <button
            type="submit"
            className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Add dish
          </button>
        </form>
      </details>

      {/* ---- dish list ---- */}
      <section className="mt-8 space-y-8">
        {grouped.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
            No dishes yet — add your first one above.
          </p>
        ) : (
          grouped.map((group) => (
            <div key={group.key}>
              <h2 className="mb-3 text-lg font-semibold text-stone-800">
                {group.name}
              </h2>
              <ul className="space-y-3">
                {group.dishes.map((dish) => (
                  <li
                    key={dish.id}
                    className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                        <DishThumb
                          name={dish.name}
                          seed={dish.id}
                          thumbnailUrl={dish.thumbnailUrl}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-stone-900">
                            {dish.name}
                          </p>
                          {dish.featured && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              ★
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-stone-500">
                          {formatPrice(dish.price, restaurant.currency)}
                          {dish.serves ? ` · serves ${dish.serves}` : ""} ·{" "}
                          {dish._count.arViews} AR
                          {!dish.usdzUrl && (
                            <span
                              className="ml-1 text-amber-600"
                              title="No USDZ — iOS AR disabled"
                            >
                              · no iOS AR
                            </span>
                          )}
                        </p>
                      </div>

                      {/* reorder */}
                      <div className="flex flex-col">
                        <ReorderButton
                          id={dish.id}
                          slug={restaurant.slug}
                          direction="up"
                        />
                        <ReorderButton
                          id={dish.id}
                          slug={restaurant.slug}
                          direction="down"
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2">
                      <DeleteDishButton
                        id={dish.id}
                        slug={restaurant.slug}
                        name={dish.name}
                      />
                      <details className="group">
                        <summary className="cursor-pointer rounded-lg px-2.5 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50">
                          Edit
                        </summary>
                        <form
                          action={updateDish}
                          className="mt-3 rounded-xl bg-stone-50 p-3"
                        >
                          <input type="hidden" name="id" value={dish.id} />
                          <input
                            type="hidden"
                            name="slug"
                            value={restaurant.slug}
                          />
                          <DishFormFields
                            dish={dish}
                            categories={categories}
                            idPrefix={`edit-${dish.id}`}
                          />
                          <button
                            type="submit"
                            className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                          >
                            Save changes
                          </button>
                        </form>
                      </details>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function ReorderButton({
  id,
  slug,
  direction,
}: {
  id: string;
  slug: string;
  direction: "up" | "down";
}) {
  return (
    <form action={moveDish}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        aria-label={`Move ${direction}`}
        className="px-1.5 text-stone-400 hover:text-stone-700"
      >
        {direction === "up" ? "▲" : "▼"}
      </button>
    </form>
  );
}
