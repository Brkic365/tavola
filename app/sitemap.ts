import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Refresh hourly so new restaurants/dishes show up without a redeploy.
export const revalidate = 3600;

// Absolute base for sitemap URLs; set NEXT_PUBLIC_SITE_URL in production
// (e.g. https://tavola.vercel.app).
const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurants = await prisma.restaurant.findMany({
    select: {
      slug: true,
      updatedAt: true,
      dishes: { select: { id: true, updatedAt: true }, where: { available: true } },
    },
  });

  const entries: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
  ];
  for (const r of restaurants) {
    entries.push(
      {
        url: `${BASE}/r/${r.slug}`,
        lastModified: r.updatedAt,
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${BASE}/r/${r.slug}/menu`,
        lastModified: r.updatedAt,
        changeFrequency: "daily",
        priority: 0.5,
      },
    );
    for (const d of r.dishes) {
      entries.push({
        url: `${BASE}/r/${r.slug}/dish/${d.id}`,
        lastModified: d.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }
  return entries;
}
