"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifyInviteToken,
} from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

// ---- auth -----------------------------------------------------------------

async function setSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function login(formData: FormData) {
  const email = (str(formData, "email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : null;
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect(`/admin/login?${new URLSearchParams({ error: "1", next })}`);
  }

  await setSession(user.id);
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signup(formData: FormData) {
  const email = (str(formData, "email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = str(formData, "name");

  if (!email || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
    redirect(`/admin/signup?error=invalid`);
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    redirect(`/admin/signup?error=exists`);
  }

  const user = await prisma.user.create({
    data: { email, name, passwordHash: await hashPassword(password), role: "OWNER" },
  });
  await setSession(user.id);
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function updateAccount(formData: FormData) {
  const user = await requireUser();
  const name = str(formData, "name");
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  const data: { name: string | null; passwordHash?: string } = { name };

  if (newPassword) {
    if (newPassword.length < 6) redirect("/admin/account?error=weak");
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !(await verifyPassword(currentPassword, dbUser.passwordHash))) {
      redirect("/admin/account?error=wrongpw");
    }
    data.passwordHash = await hashPassword(newPassword);
  }

  await prisma.user.update({ where: { id: user.id }, data });
  redirect("/admin/account?saved=1");
}

// ---- form parsing helpers -------------------------------------------------

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function int(fd: FormData, key: string): number | null {
  const n = num(fd, key);
  return n === null ? null : Math.round(n);
}

function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

// ---- authorization --------------------------------------------------------

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** May the current user MANAGE this restaurant? (ADMIN, owner, or member.) */
async function assertCanManage(restaurantId: string | null) {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;
  if (!restaurantId) redirect("/admin");
  const r = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { ownerId: true },
  });
  if (r?.ownerId === user.id) return user;
  const m = await prisma.membership.findUnique({
    where: { userId_restaurantId: { userId: user.id, restaurantId } },
  });
  if (!m) redirect("/admin");
  return user;
}

/** Owner-only (ADMIN or owner) — for team management. */
async function assertIsOwner(restaurantId: string | null) {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;
  if (!restaurantId) redirect("/admin");
  const r = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { ownerId: true },
  });
  if (r?.ownerId !== user.id) redirect("/admin");
  return user;
}

async function restaurantIdOfDish(dishId: string): Promise<string | null> {
  const d = await prisma.dish.findUnique({
    where: { id: dishId },
    select: { restaurantId: true },
  });
  return d?.restaurantId ?? null;
}

async function restaurantIdOfCategory(
  categoryId: string,
): Promise<string | null> {
  const c = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { restaurantId: true },
  });
  return c?.restaurantId ?? null;
}

// Map common Croatian/Slavic diacritics to ASCII for clean slugs.
const DIACRITICS: Record<string, string> = {
  č: "c",
  ć: "c",
  đ: "d",
  š: "s",
  ž: "z",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[čćđšž]/g, (m) => DIACRITICS[m] ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  const root = base || "restaurant";
  let candidate = root;
  let n = 1;
  while (await prisma.restaurant.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-${++n}`;
  }
  return candidate;
}

// ---- restaurant -----------------------------------------------------------

export async function createRestaurant(formData: FormData) {
  const user = await requireUser();
  const name = str(formData, "name");
  if (!name) return;

  const requested = str(formData, "slug");
  const slug = await ensureUniqueSlug(slugify(requested ?? name));

  await prisma.restaurant.create({
    data: {
      name,
      slug,
      brandColor: str(formData, "brandColor"),
      currency: str(formData, "currency") ?? "EUR",
      ownerId: user.id,
    },
  });

  revalidatePath("/admin");
  redirect(`/admin/${slug}`);
}

export async function updateRestaurant(formData: FormData) {
  const id = str(formData, "id");
  const slug = str(formData, "slug");
  if (!id) return;
  await assertCanManage(id);

  await prisma.restaurant.update({
    where: { id },
    data: {
      name: str(formData, "name") ?? undefined,
      brandColor: str(formData, "brandColor"),
      currency: str(formData, "currency") ?? "EUR",
      defaultLocale: str(formData, "defaultLocale"),
      logoUrl: str(formData, "logoUrl"),
    },
  });

  revalidatePath(`/admin/${slug}`);
  if (slug) revalidatePath(`/r/${slug}`);
}

export async function deleteRestaurant(formData: FormData) {
  const id = str(formData, "id");
  const slug = str(formData, "slug");
  if (!id) return;
  await assertIsOwner(id);

  // Cascades categories, dishes, memberships, and analytics rows.
  await prisma.restaurant.delete({ where: { id } });

  if (slug) revalidatePath(`/r/${slug}`);
  revalidatePath("/admin");
  redirect("/admin");
}

// ---- team -----------------------------------------------------------------

/** Accept an invite link → become a member of the restaurant. */
export async function joinRestaurant(formData: FormData) {
  const user = await requireUser();
  const inv = await verifyInviteToken(String(formData.get("token") ?? ""));
  if (!inv) redirect("/admin?error=invite");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: inv.restaurantId },
    select: { slug: true, ownerId: true },
  });
  if (!restaurant) redirect("/admin?error=invite");

  // The owner already has full access — no membership needed.
  if (restaurant.ownerId !== user.id) {
    await prisma.membership.upsert({
      where: {
        userId_restaurantId: { userId: user.id, restaurantId: inv.restaurantId },
      },
      create: { userId: user.id, restaurantId: inv.restaurantId },
      update: {},
    });
  }
  redirect(`/admin/${restaurant.slug}`);
}

/** Owner removes a member. */
export async function removeMember(formData: FormData) {
  const restaurantId = str(formData, "restaurantId");
  const userId = str(formData, "userId");
  const slug = str(formData, "slug");
  if (!restaurantId || !userId) return;
  await assertIsOwner(restaurantId);

  await prisma.membership.deleteMany({ where: { restaurantId, userId } });
  reval(slug);
}

/** A member leaves a restaurant they were invited to. */
export async function leaveRestaurant(formData: FormData) {
  const user = await requireUser();
  const restaurantId = str(formData, "restaurantId");
  if (!restaurantId) return;

  await prisma.membership.deleteMany({
    where: { restaurantId, userId: user.id },
  });
  revalidatePath("/admin");
  redirect("/admin");
}

// ---- categories -----------------------------------------------------------

function categoryTranslationsFromForm(fd: FormData) {
  const out: Record<string, { name?: string }> = {};
  for (const loc of ["en", "de", "it"]) {
    const name = str(fd, `tr_${loc}_name`);
    if (name) out[loc] = { name };
  }
  return Object.keys(out).length ? out : Prisma.DbNull;
}

function reval(slug: string | null) {
  if (slug) {
    revalidatePath(`/admin/${slug}`);
    revalidatePath(`/r/${slug}`);
  }
}

export async function createCategory(formData: FormData) {
  const restaurantId = str(formData, "restaurantId");
  const slug = str(formData, "slug");
  const name = str(formData, "name");
  if (!restaurantId || !name) return;
  await assertCanManage(restaurantId);

  const count = await prisma.category.count({ where: { restaurantId } });
  await prisma.category.create({
    data: { restaurantId, name, sortOrder: count },
  });

  reval(slug);
}

export async function updateCategory(formData: FormData) {
  const id = str(formData, "id");
  const slug = str(formData, "slug");
  const name = str(formData, "name");
  if (!id || !name) return;
  await assertCanManage(await restaurantIdOfCategory(id));

  await prisma.category.update({
    where: { id },
    data: { name, translations: categoryTranslationsFromForm(formData) },
  });

  reval(slug);
}

export async function deleteCategory(formData: FormData) {
  const id = str(formData, "id");
  const slug = str(formData, "slug");
  if (!id) return;
  await assertCanManage(await restaurantIdOfCategory(id));

  // Dishes keep existing — their categoryId is set null (onDelete: SetNull).
  await prisma.category.delete({ where: { id } });

  reval(slug);
}

/** Swap a category with its neighbour to reorder. */
export async function moveCategory(formData: FormData) {
  const id = str(formData, "id");
  const slug = str(formData, "slug");
  const direction = str(formData, "direction"); // "up" | "down"
  if (!id || !direction) return;
  await assertCanManage(await restaurantIdOfCategory(id));

  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return;

  const siblings = await prisma.category.findMany({
    where: { restaurantId: cat.restaurantId },
    orderBy: { sortOrder: "asc" },
  });
  const idx = siblings.findIndex((c) => c.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) return;

  const a = siblings[idx];
  const b = siblings[swapIdx];
  await prisma.$transaction([
    prisma.category.update({
      where: { id: a.id },
      data: { sortOrder: b.sortOrder },
    }),
    prisma.category.update({
      where: { id: b.id },
      data: { sortOrder: a.sortOrder },
    }),
  ]);

  reval(slug);
}

// ---- dishes ---------------------------------------------------------------

function translationsFromForm(fd: FormData) {
  const out: Record<string, { name?: string; description?: string }> = {};
  for (const loc of ["en", "de", "it"]) {
    const name = str(fd, `tr_${loc}_name`);
    const description = str(fd, `tr_${loc}_description`);
    if (name || description) {
      out[loc] = {};
      if (name) out[loc].name = name;
      if (description) out[loc].description = description;
    }
  }
  // Prisma.DbNull clears a nullable Json column; an object sets it.
  return Object.keys(out).length ? out : Prisma.DbNull;
}

function dishDataFromForm(formData: FormData) {
  return {
    name: str(formData, "name") ?? "Untitled dish",
    description: str(formData, "description"),
    translations: translationsFromForm(formData),
    price: num(formData, "price") ?? 0,
    glbUrl: str(formData, "glbUrl") ?? "",
    usdzUrl: str(formData, "usdzUrl"),
    thumbnailUrl: str(formData, "thumbnailUrl"),
    widthCm: num(formData, "widthCm"),
    depthCm: num(formData, "depthCm"),
    heightCm: num(formData, "heightCm"),
    // Measured from the GLB in admin (model-viewer.getDimensions); powers the
    // public "Verified to scale" badge.
    modelWidthCm: num(formData, "modelWidthCm"),
    modelDepthCm: num(formData, "modelDepthCm"),
    modelHeightCm: num(formData, "modelHeightCm"),
    weightG: int(formData, "weightG"),
    serves: str(formData, "serves"),
    allergens: str(formData, "allergens"),
    calories: int(formData, "calories"),
    dietary: str(formData, "dietary"),
    featured: bool(formData, "featured"),
    // The form carries "soldOut"; absence (new dishes) => available.
    available: !bool(formData, "soldOut"),
    categoryId: str(formData, "categoryId"), // null => uncategorized
  };
}

/** Quick "86" toggle from the dish list — flip a dish in/out of stock. */
export async function setDishAvailability(formData: FormData) {
  const id = str(formData, "id");
  const slug = str(formData, "slug");
  if (!id) return;
  await assertCanManage(await restaurantIdOfDish(id));

  await prisma.dish.update({
    where: { id },
    data: { available: bool(formData, "available") },
  });

  if (slug) {
    revalidatePath(`/admin/${slug}`);
    revalidatePath(`/r/${slug}`);
  }
}

export async function createDish(formData: FormData) {
  const restaurantId = str(formData, "restaurantId");
  const slug = str(formData, "slug");
  if (!restaurantId) return;
  await assertCanManage(restaurantId);

  const data = dishDataFromForm(formData);
  if (!data.glbUrl) return; // a model is required to be useful

  const count = await prisma.dish.count({
    where: { restaurantId, categoryId: data.categoryId },
  });

  await prisma.dish.create({
    data: { restaurantId, sortOrder: count, ...data },
  });

  if (slug) {
    revalidatePath(`/admin/${slug}`);
    revalidatePath(`/r/${slug}`);
  }
}

export async function updateDish(formData: FormData) {
  const id = str(formData, "id");
  const slug = str(formData, "slug");
  if (!id) return;
  await assertCanManage(await restaurantIdOfDish(id));

  const data = dishDataFromForm(formData);
  await prisma.dish.update({ where: { id }, data });

  if (slug) {
    revalidatePath(`/admin/${slug}`);
    revalidatePath(`/r/${slug}`);
  }
}

export async function deleteDish(formData: FormData) {
  const id = str(formData, "id");
  const slug = str(formData, "slug");
  if (!id) return;
  await assertCanManage(await restaurantIdOfDish(id));

  await prisma.dish.delete({ where: { id } });

  if (slug) {
    revalidatePath(`/admin/${slug}`);
    revalidatePath(`/r/${slug}`);
  }
}

/** Clone a dish (with all metadata + translations) as a new draft. */
export async function duplicateDish(formData: FormData) {
  const id = str(formData, "id");
  const slug = str(formData, "slug");
  if (!id) return;

  const src = await prisma.dish.findUnique({ where: { id } });
  if (!src) return;
  await assertCanManage(src.restaurantId);

  // Strip identity/audit fields; everything else is copied verbatim.
  const {
    id: _id,
    createdAt: _c,
    updatedAt: _u,
    sortOrder: _s,
    name,
    ...rest
  } = src;

  const count = await prisma.dish.count({
    where: { restaurantId: src.restaurantId, categoryId: src.categoryId },
  });

  await prisma.dish.create({
    data: {
      ...rest,
      name: `${name} (copy)`,
      // A fresh copy starts hidden-from-spotlight + in stock; the operator can
      // adjust before it goes live.
      featured: false,
      available: true,
      sortOrder: count,
      // Prisma needs Json null sent as DbNull, not literal null.
      translations: (src.translations ?? Prisma.DbNull) as Prisma.InputJsonValue,
    },
  });

  if (slug) {
    revalidatePath(`/admin/${slug}`);
    revalidatePath(`/r/${slug}`);
  }
}

/** Swap a dish with its neighbour (within the same category) to reorder. */
export async function moveDish(formData: FormData) {
  const id = str(formData, "id");
  const slug = str(formData, "slug");
  const direction = str(formData, "direction"); // "up" | "down"
  if (!id || !direction) return;
  await assertCanManage(await restaurantIdOfDish(id));

  const dish = await prisma.dish.findUnique({ where: { id } });
  if (!dish) return;

  const siblings = await prisma.dish.findMany({
    where: { restaurantId: dish.restaurantId, categoryId: dish.categoryId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const idx = siblings.findIndex((d) => d.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) return;

  const a = siblings[idx];
  const b = siblings[swapIdx];

  // Swap sortOrder (no unique constraint, so a direct swap is fine).
  await prisma.$transaction([
    prisma.dish.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.dish.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);

  if (slug) {
    revalidatePath(`/admin/${slug}`);
    revalidatePath(`/r/${slug}`);
  }
}
