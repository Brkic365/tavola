import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 8; // per key per window

/** Best-effort client IP from proxy headers; "local" when unavailable (dev). */
export async function clientKey(prefix: string): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  const ip =
    (fwd ? fwd.split(",")[0].trim() : "") || h.get("x-real-ip") || "local";
  return `${prefix}:${ip}`;
}

/**
 * Record an attempt for `key` and report whether it's now over the limit.
 * Old rows are pruned first so the table stays bounded. Returns blocked=true
 * (without recording) once MAX_ATTEMPTS are already present in the window.
 */
export async function rateLimit(
  key: string,
): Promise<{ blocked: boolean; retryAfterMin: number }> {
  const cutoff = new Date(Date.now() - WINDOW_MS);
  try {
    await prisma.loginAttempt.deleteMany({
      where: { key, createdAt: { lt: cutoff } },
    });
    const count = await prisma.loginAttempt.count({ where: { key } });
    if (count >= MAX_ATTEMPTS) {
      return { blocked: true, retryAfterMin: Math.ceil(WINDOW_MS / 60000) };
    }
    await prisma.loginAttempt.create({ data: { key } });
    return { blocked: false, retryAfterMin: 0 };
  } catch {
    // Never let the limiter take down auth — fail open.
    return { blocked: false, retryAfterMin: 0 };
  }
}

/** Clear a key's attempts after a successful auth (so it doesn't accrue). */
export async function clearRateLimit(key: string): Promise<void> {
  try {
    await prisma.loginAttempt.deleteMany({ where: { key } });
  } catch {
    /* ignore */
  }
}
