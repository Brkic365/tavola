import type { Metadata } from "next";
import Link from "next/link";
import { SCAN_CREDITS, SCAN_LICENSE } from "@/lib/scanCredits";

export const metadata: Metadata = {
  title: "3D scan credits · Tavola",
};

/** Attribution for the CC BY 4.0 food scans used on Tavola menus. */
export default function CreditsPage() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6"
    >
      <Link href="/" className="text-base font-semibold text-strong underline underline-offset-4">
        Tavola
      </Link>
      <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-strong">
        3D scan credits
      </h1>
      <p className="mt-3 text-base text-soft">
        The dishes you see in 3D are scans of real food, shared on Sketchfab
        under the{" "}
        <a
          href={SCAN_LICENSE.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-strong underline underline-offset-4"
        >
          {SCAN_LICENSE.name}
        </a>{" "}
        licence. We cleaned up, resized and re-lit them to sit at real size on
        your table. Thank you to the people who made them.
      </p>
      <ul className="mt-8 divide-y divide-[var(--hairline)] rounded-xl border border-hair surface">
        {SCAN_CREDITS.map((c) => (
          <li key={c.file} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3.5">
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-strong underline underline-offset-4"
            >
              {c.title}
            </a>
            <span className="text-soft">
              by{" "}
              <a
                href={c.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-strong underline underline-offset-4"
              >
                {c.author}
              </a>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
