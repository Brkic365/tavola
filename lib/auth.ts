// Self-contained auth primitives (no external service). Web Crypto only, so it
// runs in BOTH Node server actions and the Edge proxy.
//
// Session cookie value: "<userId>.<expiryMs>.<hmacSHA256(secret, userId.exp)>"
// Passwords: PBKDF2-SHA256, stored as "pbkdf2$<iters>$<saltHex>$<hashHex>".

export const SESSION_COOKIE = "tavola_admin";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_MAX_AGE_SECONDS = MAX_AGE_MS / 1000;

const encoder = new TextEncoder();

// Web Crypto wants BufferSource; cast around the stricter Uint8Array generics.
function utf8(s: string): BufferSource {
  return encoder.encode(s) as BufferSource;
}

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "dev-insecure-secret-change-me";
}

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---- session tokens -------------------------------------------------------

async function sign(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    utf8(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, utf8(message));
  return toHex(sig);
}

export async function createSessionToken(userId: string): Promise<string> {
  const exp = Date.now() + MAX_AGE_MS;
  const payload = `${userId}.${exp}`;
  return `${payload}.${await sign(payload)}`;
}

/** Verify a session token; returns the userId if valid, else null. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!userId || !Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = await sign(`${userId}.${expStr}`);
  return timingSafeEqual(sig, expected) ? userId : null;
}

// ---- team invite tokens ---------------------------------------------------

const INVITE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Signed, expiring token that grants membership of a restaurant. */
export async function createInviteToken(restaurantId: string): Promise<string> {
  const exp = Date.now() + INVITE_MAX_AGE_MS;
  const payload = `inv.${restaurantId}.${exp}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyInviteToken(
  token: string | undefined | null,
): Promise<{ restaurantId: string } | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "inv") return null;
  const [, restaurantId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!restaurantId || !Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = await sign(`inv.${restaurantId}.${expStr}`);
  return timingSafeEqual(sig, expected) ? { restaurantId } : null;
}

// ---- password hashing -----------------------------------------------------

const PBKDF2_ITERATIONS = 100_000;

async function derive(
  password: string,
  salt: BufferSource,
  iterations: number,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    utf8(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt as BufferSource, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${hash}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, iterStr, saltHex, hashHex] = stored.split("$");
  if (scheme !== "pbkdf2" || !saltHex || !hashHex) return false;
  const hash = await derive(
    password,
    fromHex(saltHex) as BufferSource,
    Number(iterStr),
  );
  return timingSafeEqual(hash, hashHex);
}
