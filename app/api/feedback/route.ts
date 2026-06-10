import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { TABLE_COOKIE, sanitizeTable } from "@/lib/table";

const VERDICTS = new Set(["smaller", "as_expected", "bigger"]);

// POST /api/feedback  { dishId, verdict }  → records one portion-expectation
// answer (best-effort, sessionless; the client de-dupes via localStorage).
export async function POST(request: Request) {
  try {
    const { dishId, verdict } = await request.json();
    if (typeof dishId !== "string" || !dishId || !VERDICTS.has(verdict)) {
      return NextResponse.json({ error: "bad payload" }, { status: 400 });
    }

    const dish = await prisma.dish.findUnique({
      where: { id: dishId },
      select: { id: true },
    });
    if (!dish) {
      return NextResponse.json({ error: "dish not found" }, { status: 404 });
    }

    const table = sanitizeTable((await cookies()).get(TABLE_COOKIE)?.value);
    await prisma.dishFeedback.create({ data: { dishId, verdict, table } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
