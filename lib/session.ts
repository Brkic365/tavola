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

/** ADMINs can edit anything; OWNERs only restaurants they own. */
export function canEdit(
  user: SessionUser | null,
  ownerId: string | null | undefined,
): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || (!!ownerId && ownerId === user.id);
}
