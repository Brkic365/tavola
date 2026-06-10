import { cookies } from "next/headers";
import { THEME_COOKIE, isThemeMode } from "@/lib/theme-mode";

/**
 * Guest layout — applies the cookie-chosen light/dark palette to a wrapper that
 * scopes the dark theme to guest pages only (the admin tool stays light).
 * Reading the cookie server-side avoids a flash of the wrong theme.
 */
export default async function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = (await cookies()).get(THEME_COOKIE)?.value;
  const dark = isThemeMode(raw) && raw === "dark";

  return (
    <div
      data-theme-root
      className={`flex min-h-screen flex-col ${dark ? "theme-dark" : ""}`}
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {children}
    </div>
  );
}
