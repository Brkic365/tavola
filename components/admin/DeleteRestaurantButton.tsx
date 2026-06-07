"use client";

import { deleteRestaurant } from "@/app/admin/actions";

export default function DeleteRestaurantButton({
  id,
  slug,
  name,
}: {
  id: string;
  slug: string;
  name: string;
}) {
  return (
    <form
      action={deleteRestaurant}
      onSubmit={(e) => {
        const v = window.prompt(
          `This permanently deletes “${name}” and ALL its dishes, categories, members and analytics.\n\nType the slug "${slug}" to confirm:`,
        );
        if (v !== slug) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
      >
        Delete restaurant
      </button>
    </form>
  );
}
