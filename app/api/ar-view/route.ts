import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { TABLE_COOKIE, sanitizeTable } from "@/lib/table";

// POST /api/ar-view  { dishId }  → records one AR launch (best-effort analytics).
export async function POST(request: Request) {
  try {
    const { dishId } = await request.json();
    if (typeof dishId !== "string" || !dishId) {
      return NextResponse.json({ error: "dishId required" }, { status: 400 });
    }

    // Guard against bogus ids — the FK would throw, but a clear 404 is nicer.
    const dish = await prisma.dish.findUnique({
      where: { id: dishId },
      select: { id: true },
    });
    if (!dish) {
      return NextResponse.json({ error: "dish not found" }, { status: 404 });
    }

    const table = sanitizeTable((await cookies()).get(TABLE_COOKIE)?.value);
    await prisma.arView.create({ data: { dishId, table } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
