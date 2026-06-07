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
} from "@/lib/auth";

// ---- auth -----------------------------------------------------------------

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const expected = process.env.ADMIN_PASSWORD ?? "tavola";

  if (password !== expected) {
    const q = new URLSearchParams({ error: "1", next });
    redirect(`/admin/login?${q.toString()}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
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
    },
  });

  revalidatePath("/admin");
  redirect(`/admin/${slug}`);
}

export async function updateRestaurant(formData: FormData) {
  const id = str(formData, "id");
  const slug = str(formData, "slug");
  if (!id) return;

  await prisma.restaurant.update({
    where: { id },
    data: {
      name: str(formData, "name") ?? undefined,
      brandColor: str(formData, "brandColor"),
      currency: str(formData, "currency") ?? "EUR",
      defaultLocale: str(formData, "defaultLocale"),
    },
  });

  revalidatePath(`/admin/${slug}`);
  if (slug) revalidatePath(`/r/${slug}`);
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
    categoryId: str(formData, "categoryId"), // null => uncategorized
  };
}

export async function createDish(formData: FormData) {
  const restaurantId = str(formData, "restaurantId");
  const slug = str(formData, "slug");
  if (!restaurantId) return;

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

  await prisma.dish.delete({ where: { id } });

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
