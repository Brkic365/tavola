import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { put } from "@vercel/blob";

// USDZ files are converted from GLB in the admin browser (Three.js USDZExporter)
// and POSTed here as raw bytes. They're persisted so they can be a dish's
// usdzUrl (iOS Quick Look).
//
//  - With BLOB_READ_WRITE_TOKEN set (Vercel) → Vercel Blob (works on serverless).
//  - Otherwise (local dev) → public/models/generated on disk.
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

    const file = `${safeBase(name)}-${crypto.randomUUID().slice(0, 8)}.usdz`;

    // Production / configured: store in Vercel Blob.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`models/generated/${file}`, bytes, {
        access: "public",
        contentType: "model/vnd.usdz+zip",
      });
      return NextResponse.json({ url: blob.url });
    }

    // Local dev fallback: write into /public.
    const dir = path.join(process.cwd(), "public", "models", "generated");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, file), bytes);
    return NextResponse.json({ url: `/models/generated/${file}` });
  } catch {
    return NextResponse.json({ error: "write failed" }, { status: 500 });
  }
}
