"use client";

import { leaveRestaurant } from "@/app/admin/actions";

export default function LeaveRestaurantButton({
  restaurantId,
  name,
}: {
  restaurantId: string;
  name: string;
}) {
  return (
    <form
      action={leaveRestaurant}
      onSubmit={(e) => {
        if (!confirm(`Leave “${name}”? You'll lose access until re-invited.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <button
        type="submit"
        className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
      >
        Leave team
      </button>
    </form>
  );
}
