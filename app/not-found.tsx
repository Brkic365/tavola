import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="text-5xl">🍽️</div>
      <h1 className="text-xl font-bold text-stone-900">Not found</h1>
      <p className="text-stone-500">
        That menu or dish doesn&apos;t exist. It may have been moved or removed.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
      >
        Back home
      </Link>
    </main>
  );
}
