import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManageRestaurant } from "@/lib/session";
import { importMenuCsv } from "@/app/admin/actions";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = { title: "Import menu · Tavola" };

const COLUMNS =
  "Category, Name, Price, Variants, Serves, Width (cm), Depth (cm), " +
  "Height (cm), Weight (g), Calories, Allergens, Dietary, Available, " +
  "Featured, GLB URL, USDZ URL, Description";

const ERRORS: Record<string, string> = {
  nofile: "No file selected — choose a .csv file first.",
  empty: "That file has no data rows.",
  noname: 'The file needs a "Name" column.',
};

/** Bulk-import the menu from a CSV in the export's format (round-trip). */
export default async function ImportPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) notFound();
  if (!(await canManageRestaurant(user, restaurant.id))) redirect("/admin");

  const error = typeof sp.error === "string" ? ERRORS[sp.error] : null;
  const created = typeof sp.created === "string" ? Number(sp.created) : null;
  const updated = typeof sp.updated === "string" ? Number(sp.updated) : 0;
  const skipped = typeof sp.skipped === "string" ? Number(sp.skipped) : 0;

  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <Link
        href={`/admin/${slug}`}
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Back to manage
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">
        Import menu from CSV
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Build or edit your menu in a spreadsheet, then upload it here. Dishes
        are matched by <strong>name</strong> — existing dishes are updated, new
        names are created, and categories are auto-created. Only the columns
        present in your file are changed.
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
      {created !== null && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          ✓ Import complete — {created} created, {updated} updated
          {skipped > 0 ? `, ${skipped} skipped (no name)` : ""}.{" "}
          <Link href={`/r/${slug}`} className="underline" target="_blank">
            View the menu ↗
          </Link>
        </p>
      )}

      <form
        action={importMenuCsv}
        className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="restaurantId" value={restaurant.id} />
        <input type="hidden" name="slug" value={slug} />
        <label className="block">
          <span className="block text-sm font-medium text-stone-700">
            CSV file
          </span>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="mt-2 block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-800"
          />
        </label>
        <button
          type="submit"
          className="mt-4 rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900"
        >
          ⤒ Import
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-600">
        <h2 className="font-semibold text-stone-800">Format</h2>
        <p className="mt-2">
          Same columns as the{" "}
          <a
            href={`/admin/${slug}/export`}
            className="font-medium text-teal-700 hover:underline"
          >
            CSV export
          </a>{" "}
          — export first and use it as your template:
        </p>
        <p className="mt-2 rounded-lg bg-white px-3 py-2 font-mono text-xs text-stone-500 ring-1 ring-stone-200">
          {COLUMNS}
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-stone-500">
          <li>Only “Name” is required; other columns are optional.</li>
          <li>
            Variants: <code>Small @ 12 (250g) | Large @ 16 (400g)</code>
          </li>
          <li>Available / Featured: yes or no.</li>
          <li>
            New dishes without a GLB URL get a placeholder model you can
            replace later.
          </li>
          <li>Up to 500 rows per import.</li>
        </ul>
      </div>
    </main>
  );
}
