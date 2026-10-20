"use client";

import { useState } from "react";
import { DISH_LIBRARY } from "@/lib/bundledModels";

/**
 * Pick a ready-made, true-to-scale dish model: fills the GLB + thumbnail
 * inputs so a dish gets real 3D without the operator capturing anything.
 */
export default function ModelLibrary({ idPrefix }: { idPrefix: string }) {
  const [picked, setPicked] = useState<string | null>(null);

  function pick(m: (typeof DISH_LIBRARY)[number]) {
    const set = (suffix: string, value: string) => {
      const el = document.getElementById(`${idPrefix}-${suffix}`) as HTMLInputElement | null;
      if (el) el.value = value;
    };
    set("glbUrl", m.glbUrl);
    set("thumbnailUrl", m.thumbnailUrl);
    setPicked(m.slug);
  }

  return (
    <details className="col-span-2 rounded-lg border border-stone-200 p-3">
      <summary className="cursor-pointer text-sm font-medium text-stone-700">
        Choose from the dish model library
      </summary>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {DISH_LIBRARY.map((m) => (
          <button
            key={m.slug}
            type="button"
            onClick={() => pick(m)}
            aria-pressed={picked === m.slug}
            className={`overflow-hidden rounded-lg border text-left text-xs transition hover:border-stone-400 ${
              picked === m.slug ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static local thumbs */}
            <img src={m.thumbnailUrl} alt="" className="aspect-square w-full bg-stone-100 object-cover" />
            <span className="block truncate px-1.5 py-1 text-stone-700">{m.label}</span>
          </button>
        ))}
      </div>
      {picked && (
        <p className="mt-2 text-xs text-stone-500">
          Model and thumbnail filled in. Use “Measure from 3D model” below to check the stated size.
        </p>
      )}
    </details>
  );
}
