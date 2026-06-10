"use client";

import { useState } from "react";
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-base text-white/90 transition hover:bg-white/10"
    >
      <span aria-hidden>{dark ? "☀️" : "🌙"}</span>
    </button>
  );
}
