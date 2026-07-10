import Link from "next/link";
import { UtensilsCrossed, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
        <UtensilsCrossed className="h-7 w-7" strokeWidth={1.5} />
      </div>
      <h1 className="font-serif text-2xl font-semibold text-strong">
        Not found
      </h1>
      <p className="text-soft">
        That menu or dish doesn&apos;t exist. It may have been moved or removed.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
      >
        Back home
        <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </Link>
    </main>
  );
}
