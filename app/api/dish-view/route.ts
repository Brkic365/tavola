import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/dish-view  { dishId }  → records one dish-detail view (top of the
// view → AR-launch funnel). Best-effort, public (guests call it).
export async function POST(request: Request) {
  try {
    const { dishId } = await request.json();
    if (typeof dishId !== "string" || !dishId) {
      return NextResponse.json({ error: "dishId required" }, { status: 400 });
    }

    const dish = await prisma.dish.findUnique({
      where: { id: dishId },
      select: { id: true },
    });
    if (!dish) {
      return NextResponse.json({ error: "dish not found" }, { status: 404 });
    }

    await prisma.dishView.create({ data: { dishId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
