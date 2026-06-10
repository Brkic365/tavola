"use client";

import { useRef, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Live admin dish-list filter — writes ?q= to the URL (debounced) so the
 * server re-renders the filtered list. Keeps server-rendered dish forms intact.
 */
export default function DishSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(value: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    }, 200);
  }

  return (
    <input
      type="search"
      name="q"
      defaultValue={params.get("q") ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search dishes…"
      aria-label="Search dishes"
      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:w-64"
    />
  );
}
