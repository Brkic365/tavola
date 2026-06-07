import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "OWNER";
};

/** The logged-in user (from the session cookie), or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
  return user;
}

/** Owner-level: ADMIN, or the restaurant's owner. (Team management, delete.) */
export function isOwner(
  user: SessionUser | null,
  ownerId: string | null | undefined,
): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || (!!ownerId && ownerId === user.id);
}

/** Manage-level: ADMIN, owner, OR an invited member of the restaurant. */
export async function canManageRestaurant(
  user: SessionUser | null,
  restaurantId: string,
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  const r = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { ownerId: true },
  });
  if (r?.ownerId === user.id) return true;
  const m = await prisma.membership.findUnique({
    where: { userId_restaurantId: { userId: user.id, restaurantId } },
  });
  return !!m;
}
