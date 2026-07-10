"use client";

import { Printer } from "lucide-react";

export default function PrintButton({
  className = "",
  label = "Print this menu",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        className ||
        "inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
      }
    >
      <Printer className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}
