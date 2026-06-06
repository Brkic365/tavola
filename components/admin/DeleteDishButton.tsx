"use client";

import { deleteDish } from "@/app/admin/actions";

export default function DeleteDishButton({
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
      action={deleteDish}
      onSubmit={(e) => {
        if (!confirm(`Delete “${name}”? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}
