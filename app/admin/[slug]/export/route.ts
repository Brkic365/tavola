import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManageRestaurant } from "@/lib/session";

/** RFC-4180 CSV cell: wrap in quotes and double any embedded quotes. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

const COLUMNS: Array<[string, (d: Dish, catName: string) => unknown]> = [
  ["Category", (_d, cat) => cat],
  ["Name", (d) => d.name],
  ["Price", (d) => d.price],
  ["Serves", (d) => d.serves],
  ["Width (cm)", (d) => d.widthCm],
  ["Depth (cm)", (d) => d.depthCm],
  ["Height (cm)", (d) => d.heightCm],
  ["Weight (g)", (d) => d.weightG],
  ["Calories", (d) => d.calories],
  ["Allergens", (d) => d.allergens],
  ["Dietary", (d) => d.dietary],
  ["Available", (d) => (d.available ? "yes" : "no")],
  ["Featured", (d) => (d.featured ? "yes" : "no")],
  ["GLB URL", (d) => d.glbUrl],
  ["USDZ URL", (d) => d.usdzUrl],
  ["Description", (d) => d.description],
];

type Dish = {
  name: string;
  description: string | null;
  price: number;
  serves: string | null;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  weightG: number | null;
  calories: number | null;
  allergens: string | null;
  dietary: string | null;
  available: boolean;
  featured: boolean;
  glbUrl: string;
  usdzUrl: string | null;
  categoryId: string | null;
};

type Params = { params: Promise<{ slug: string }> };

/** Download the full menu as a CSV (records / backup / spreadsheet editing). */
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: { select: { id: true, name: true } },
      dishes: {
        orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
  if (!restaurant) return new NextResponse("Not found", { status: 404 });
  if (!(await canManageRestaurant(user, restaurant.id)))
    return new NextResponse("Forbidden", { status: 403 });

  const catName = new Map(restaurant.categories.map((c) => [c.id, c.name]));

  const rows = [
    COLUMNS.map(([h]) => cell(h)).join(","),
    ...restaurant.dishes.map((d) =>
      COLUMNS.map(([, get]) =>
        cell(get(d as Dish, d.categoryId ? (catName.get(d.categoryId) ?? "") : "Uncategorized")),
      ).join(","),
    ),
  ];
  // BOM so Excel reads UTF-8 (accented names) correctly.
  const csv = "﻿" + rows.join("\r\n") + "\r\n";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-menu.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
