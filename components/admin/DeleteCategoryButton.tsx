"use client";

import { deleteCategory } from "@/app/admin/actions";

export default function DeleteCategoryButton({
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
      action={deleteCategory}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete category “${name}”? Its dishes stay but become Uncategorized.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}
