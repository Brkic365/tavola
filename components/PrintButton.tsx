"use client";

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
        "rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
      }
    >
      🖨 {label}
    </button>
  );
}
