"use client";

import { removeMember } from "@/app/admin/actions";

export default function RemoveMemberButton({
  restaurantId,
  userId,
  slug,
  email,
}: {
  restaurantId: string;
  userId: string;
  slug: string;
  email: string;
}) {
  return (
    <form
      action={removeMember}
      onSubmit={(e) => {
        if (!confirm(`Remove ${email} from this restaurant's team?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        Remove
      </button>
    </form>
  );
}
