"use client";

import { useEffect, useRef } from "react";

/** Records a dish-detail view once per page load (best-effort analytics). */
export default function ViewBeacon({ dishId }: { dishId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return; // guard React strict-mode double-invoke
    fired.current = true;
    void fetch("/api/dish-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishId }),
      keepalive: true,
    }).catch(() => {});
  }, [dishId]);
  return null;
}
