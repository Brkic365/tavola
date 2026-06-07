import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { createRestaurant, logout } from "./actions";

// Gated by proxy.ts (session cookie). Multi-tenant: OWNERs see their own
// restaurants, platform ADMINs see all.

export const metadata = { title: "Admin · Tavola" };
export const dynamic = "force-dynamic";

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const restaurants = await prisma.restaurant.findMany({
    where:
      user.role === "ADMIN"
        ? undefined
        : {
            OR: [
              { ownerId: user.id },
              { memberships: { some: { userId: user.id } } },
            ],
          },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { dishes: true } },
    },
  });

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Restaurant admin
        </h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-stone-500 sm:inline">
            {user.email}
            {user.role === "ADMIN" && (
              <span className="ml-1 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-teal-800">
                admin
              </span>
            )}
          </span>
          <Link
            href="/admin/account"
            className="text-stone-500 hover:text-stone-800"
          >
            Account
          </Link>
          <Link href="/" className="text-stone-500 hover:text-stone-800">
            ← Home
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

      <section className="grid gap-8 md:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Restaurants
          </h2>
          {restaurants.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 p-6 text-sm text-stone-500">
              None yet — create one, or run{" "}
              <code className="rounded bg-stone-100 px-1.5 py-0.5">
                npm run db:seed
              </code>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {restaurants.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/${r.slug}`}
                    className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-teal-300"
                  >
                    <div>
                      <p className="font-semibold text-stone-900">{r.name}</p>
                      <p className="text-sm text-stone-500">
                        /r/{r.slug} · {r._count.dishes} dishes
                      </p>
                    </div>
                    <span className="text-teal-700">Manage →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            New restaurant
          </h2>
          <form
            action={createRestaurant}
            className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Name *</span>
              <input
                name="name"
                required
                className={inputCls}
                placeholder="Konoba Tavola"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">
                Slug (optional)
              </span>
              <input
                name="slug"
                className={inputCls}
                placeholder="auto-generated from name"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">
                  Currency
                </span>
                <input
                  name="currency"
                  defaultValue="EUR"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">
                  Brand colour
                </span>
                <input
                  name="brandColor"
                  type="color"
                  defaultValue="#0f766e"
                  className="mt-1 h-[42px] w-full rounded-lg border border-stone-300 px-1"
                />
              </label>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Create restaurant
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
