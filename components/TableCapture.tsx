"use client";

import { useEffect } from "react";
import { TABLE_COOKIE, sanitizeTable } from "@/lib/table";

/**
 * Reads ?table=N from a per-table QR on landing and stores it in a cookie so
 * the analytics beacons (server-side) can attribute the session to a table.
 */
export default function TableCapture() {
  useEffect(() => {
    try {
      const raw = new URLSearchParams(window.location.search).get("table");
      const table = sanitizeTable(raw);
      if (!table) return;
      document.cookie = `${TABLE_COOKIE}=${encodeURIComponent(table)}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
