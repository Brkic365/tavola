import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isOwner, canManageRestaurant } from "@/lib/session";
import { createInviteToken } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { LOCALES } from "@/lib/i18n";
import {
  createDish,
  updateDish,
  moveDish,
  setDishAvailability,
  duplicateDish,
  createCategory,
  updateCategory,
  moveCategory,
  updateRestaurant,
  removeMember,
  logout,
} from "@/app/admin/actions";
import DishFormFields from "@/components/admin/DishFormFields";
import DeleteDishButton from "@/components/admin/DeleteDishButton";
import DeleteCategoryButton from "@/components/admin/DeleteCategoryButton";
import RemoveMemberButton from "@/components/admin/RemoveMemberButton";
import DeleteRestaurantButton from "@/components/admin/DeleteRestaurantButton";
import LeaveRestaurantButton from "@/components/admin/LeaveRestaurantButton";
import FileUpload from "@/components/admin/FileUpload";
import CopyLinkButton from "@/components/admin/CopyLinkButton";
import MenuQR from "@/components/admin/MenuQR";
import MenuHealth from "@/components/admin/MenuHealth";
import DishThumb from "@/components/DishThumb";

type Params = { params: Promise<{ slug: string }> };

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";
const labelCls = "block text-sm font-medium text-stone-700";

export default async function ManageRestaurantPage({ params }: Params) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      owner: { select: { email: true, name: true } },
      memberships: {
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      categories: { orderBy: { sortOrder: "asc" } },
      dishes: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { arViews: true } } },
      },
    },
  });
  if (!restaurant) notFound();
  // Members + owner + admin may manage; everyone else is bounced.
  if (!(await canManageRestaurant(user, restaurant.id))) redirect("/admin");
  const owner = isOwner(user, restaurant.ownerId);

  // Build the absolute public menu URL for the QR code.
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const menuUrl = `${proto}://${host}/r/${slug}`;
  const inviteUrl = owner
    ? `${proto}://${host}/admin/join/${await createInviteToken(restaurant.id)}`
    : null;

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
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <CopyLinkButton url={menuUrl} />
            <Link
              href={`/admin/${slug}/table-card`}
              className="text-sm font-medium text-teal-700 hover:underline"
            >
              🖨 Printable table card ↗
            </Link>
          </div>
        </div>
      </section>

      <MenuHealth dishes={restaurant.dishes} />

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
            <label className="block">
              <span className={labelCls}>Default menu language</span>
              <select
                name="defaultLocale"
                defaultValue={restaurant.defaultLocale ?? "en"}
                className={inputCls}
              >
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className={labelCls}>Logo</span>
              <div className="mt-1 flex items-center gap-3">
                {restaurant.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={restaurant.logoUrl}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-stone-200"
                  />
                )}
                <input
                  id="restaurant-logoUrl"
                  type="hidden"
                  name="logoUrl"
                  defaultValue={restaurant.logoUrl ?? ""}
                />
                <FileUpload
                  targetId="restaurant-logoUrl"
                  kind="image"
                  accept="image/*"
                  label="Upload logo"
                />
              </div>
              <p className="mt-1 text-[11px] text-stone-400">
                Save settings after uploading to apply the new logo.
              </p>
            </div>

            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
              Contact (shown on the menu)
            </p>
            <label className="block">
              <span className={labelCls}>Address</span>
              <input
                name="address"
                defaultValue={restaurant.address ?? ""}
                className={inputCls}
                placeholder="Ulica 1, 20000 Dubrovnik"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelCls}>Phone</span>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={restaurant.phone ?? ""}
                  className={inputCls}
                  placeholder="+385 20 123 456"
                />
              </label>
              <label className="block">
                <span className={labelCls}>Website</span>
                <input
                  name="website"
                  defaultValue={restaurant.website ?? ""}
                  className={inputCls}
                  placeholder="example.com"
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
          </form>
        </div>

        {restaurant.categories.length > 0 && (
          <div className="border-t border-stone-100 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
              Categories
            </p>
            <ul className="space-y-2">
              {restaurant.categories.map((c, i) => {
                const tr =
                  (c.translations as Record<string, { name?: string }> | null) ??
                  {};
                return (
                  <li
                    key={c.id}
                    className="rounded-xl border border-stone-200 p-2"
                  >
                    <div className="flex items-start gap-2">
                      <form
                        action={updateCategory}
                        className="flex-1 space-y-2"
                      >
                        <input type="hidden" name="id" value={c.id} />
                        <input
                          type="hidden"
                          name="slug"
                          value={restaurant.slug}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            name="name"
                            defaultValue={c.name}
                            className={`${inputCls} mt-0 flex-1`}
                          />
                          <button
                            type="submit"
                            className="shrink-0 rounded-lg bg-stone-800 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-900"
                          >
                            Save
                          </button>
                        </div>
                        <details>
                          <summary className="cursor-pointer text-xs font-medium text-stone-500">
                            🌐 Translations (EN/DE/IT)
                          </summary>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {(["en", "de", "it"] as const).map((loc) => (
                              <input
                                key={loc}
                                name={`tr_${loc}_name`}
                                defaultValue={tr[loc]?.name ?? ""}
                                placeholder={loc.toUpperCase()}
                                className={`${inputCls} mt-0`}
                              />
                            ))}
                          </div>
                        </details>
                      </form>
                      <div className="flex flex-col">
                        <CategoryMove
                          id={c.id}
                          slug={restaurant.slug}
                          direction="up"
                          disabled={i === 0}
                        />
                        <CategoryMove
                          id={c.id}
                          slug={restaurant.slug}
                          direction="down"
                          disabled={i === restaurant.categories.length - 1}
                        />
                      </div>
                      <DeleteCategoryButton
                        id={c.id}
                        slug={restaurant.slug}
                        name={c.name}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </details>

      {/* ---- team (owner only) ---- */}
      {owner && inviteUrl && (
        <details className="mt-4 rounded-2xl border border-stone-200 bg-white shadow-sm">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-stone-700">
            👥 Team
          </summary>
          <div className="space-y-5 border-t border-stone-100 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Invite link
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Anyone with this link can join as a manager (expires in 7 days).
              </p>
              <code className="mt-2 block truncate rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-700">
                {inviteUrl}
              </code>
              <div className="mt-2">
                <CopyLinkButton url={inviteUrl} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Members
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                  <span className="text-stone-700">
                    {restaurant.owner?.email ?? "—"}
                  </span>
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-800">
                    owner
                  </span>
                </li>
                {restaurant.memberships.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2"
                  >
                    <span className="text-stone-700">{m.user.email}</span>
                    <RemoveMemberButton
                      restaurantId={restaurant.id}
                      userId={m.user.id}
                      slug={restaurant.slug}
                      email={m.user.email}
                    />
                  </li>
                ))}
                {restaurant.memberships.length === 0 && (
                  <li className="px-3 py-2 text-stone-400">
                    No members yet — share the invite link.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </details>
      )}

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
                          <p
                            className={`truncate font-semibold ${
                              dish.available
                                ? "text-stone-900"
                                : "text-stone-400 line-through"
                            }`}
                          >
                            {dish.name}
                          </p>
                          {dish.featured && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              ★
                            </span>
                          )}
                          {!dish.available && (
                            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                              Sold out
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
                      <div className="flex items-center gap-1">
                        <DeleteDishButton
                          id={dish.id}
                          slug={restaurant.slug}
                          name={dish.name}
                        />
                        <AvailabilityToggle
                          id={dish.id}
                          slug={restaurant.slug}
                          available={dish.available}
                        />
                        <form action={duplicateDish}>
                          <input type="hidden" name="id" value={dish.id} />
                          <input
                            type="hidden"
                            name="slug"
                            value={restaurant.slug}
                          />
                          <button
                            type="submit"
                            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
                          >
                            Duplicate
                          </button>
                        </form>
                      </div>
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

      {/* Danger zone (owner) / Leave team (member) */}
      <section className="mt-12 border-t border-stone-200 pt-6">
        {owner ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5">
            <h2 className="text-lg font-semibold text-red-800">Danger zone</h2>
            <p className="mt-1 max-w-xl text-sm text-stone-600">
              Permanently delete this restaurant and everything in it — dishes,
              categories, team members and analytics. This cannot be undone.
            </p>
            <div className="mt-4">
              <DeleteRestaurantButton
                id={restaurant.id}
                slug={restaurant.slug}
                name={restaurant.name}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <h2 className="text-lg font-semibold text-stone-800">Leave team</h2>
            <p className="mt-1 max-w-xl text-sm text-stone-600">
              Remove yourself from this restaurant&apos;s team. You&apos;ll lose
              access until an owner re-invites you.
            </p>
            <div className="mt-4">
              <LeaveRestaurantButton
                restaurantId={restaurant.id}
                name={restaurant.name}
              />
            </div>
          </div>
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

/** One-tap "86" toggle — submits the desired next availability state. */
function AvailabilityToggle({
  id,
  slug,
  available,
}: {
  id: string;
  slug: string;
  available: boolean;
}) {
  return (
    <form action={setDishAvailability}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="available" value={available ? "false" : "true"} />
      <button
        type="submit"
        className={`rounded-lg px-2.5 py-1.5 text-sm font-medium ${
          available
            ? "text-stone-600 hover:bg-stone-100"
            : "text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        {available ? "Mark sold out" : "Mark available"}
      </button>
    </form>
  );
}

function CategoryMove({
  id,
  slug,
  direction,
  disabled,
}: {
  id: string;
  slug: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  return (
    <form action={moveCategory}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={`Move category ${direction}`}
        className="px-1.5 text-xs text-stone-400 hover:text-stone-700 disabled:opacity-30"
      >
        {direction === "up" ? "▲" : "▼"}
      </button>
    </form>
  );
}
