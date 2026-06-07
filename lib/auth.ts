// Minimal self-contained admin auth (no external service needed).
// A session is a signed, expiring token stored in an httpOnly cookie:
//   token = "<expiryMs>.<hmacSHA256(secret, expiryMs)>"
// Uses Web Crypto only (no Node Buffer/crypto), so it runs in BOTH the Node
// server actions and the Edge middleware. For a real deployment, swap in
// Clerk/NextAuth and per-restaurant roles (see STRATEGY.md L? / roadmap).

export const SESSION_COOKIE = "tavola_admin";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "dev-insecure-secret-change-me";
}

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(sig);
}

/** Create a fresh signed session token (called on successful login). */
export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + MAX_AGE_MS;
  return `${exp}.${await sign(String(exp))}`;
}

/** Verify a session token: well-formed, unexpired, and correctly signed. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await sign(expStr);
  // length check then char compare (avoids early-exit timing where it matters)
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++)
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export const SESSION_MAX_AGE_SECONDS = MAX_AGE_MS / 1000;
