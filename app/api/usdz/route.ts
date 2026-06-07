import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// USDZ files are converted from GLB in the admin browser (Three.js USDZExporter)
// and POSTed here as raw bytes. We persist them under public/models/generated so
// they're served statically and can be set as a dish's usdzUrl (iOS Quick Look).
//
// NOTE: writing into /public works for local/self-hosted runs. On read-only
// hosts (e.g. Vercel) this should target blob storage instead — TODO.
export const runtime = "nodejs";

const MAX_BYTES = 60 * 1024 * 1024; // 60 MB safety cap

function safeBase(name: string): string {
  const base = name
    .replace(/\.(glb|gltf|usdz)$/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 40);
  return base || "model";
}

export async function POST(request: Request) {
  try {
    const name = new URL(request.url).searchParams.get("name") ?? "model";
    const bytes = Buffer.from(await request.arrayBuffer());

    if (bytes.length === 0) {
      return NextResponse.json({ error: "empty body" }, { status: 400 });
    }
    if (bytes.length > MAX_BYTES) {
      return NextResponse.json({ error: "file too large" }, { status: 413 });
    }

    const dir = path.join(process.cwd(), "public", "models", "generated");
    await mkdir(dir, { recursive: true });

    const file = `${safeBase(name)}-${crypto.randomUUID().slice(0, 8)}.usdz`;
    await writeFile(path.join(dir, file), bytes);

    return NextResponse.json({ url: `/models/generated/${file}` });
  } catch {
    return NextResponse.json({ error: "write failed" }, { status: 500 });
  }
}
