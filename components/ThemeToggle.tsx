"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_COOKIE, type ThemeMode } from "@/lib/theme-mode";

/**
 * Light/dark toggle for the guest menu. Flips the `.theme-dark` class on the
 * guest layout wrapper live and persists the choice in a cookie so the next
 * server render matches (no flash).
 */
export default function ThemeToggle({ initial }: { initial: ThemeMode }) {
  const [dark, setDark] = useState(initial === "dark");

  function toggle() {
    const next = !dark;
    setDark(next);
    const root = document.querySelector("[data-theme-root]");
    root?.classList.toggle("theme-dark", next);
    document.cookie = `${THEME_COOKIE}=${next ? "dark" : "light"}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-hair surface text-strong transition hover:border-[var(--muted)]"
    >
      {dark ? (
        <Sun className="h-5 w-5" strokeWidth={2} aria-hidden />
      ) : (
        <Moon className="h-5 w-5" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
