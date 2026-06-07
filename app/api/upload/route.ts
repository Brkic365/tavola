import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { put } from "@vercel/blob";

// Generic asset upload (GLB models + thumbnail images) from the admin.
//   - With BLOB_READ_WRITE_TOKEN (Vercel) → Vercel Blob.
//   - Otherwise (local dev) → public/uploads on disk.
//
// NOTE: this POSTs the file bytes through the function, so on Vercel it's bound
// by the serverless request-body limit (~4.5 MB). For large models, switch to
// client-direct-to-Blob (@vercel/blob/client `upload()` + handleUpload). TODO.
export const runtime = "nodejs";

const MAX_BYTES = 50 * 1024 * 1024;

const KINDS: Record<
  string,
  { dir: string; exts: string[]; contentType: string | null }
> = {
  glb: {
    dir: "uploads/models",
    exts: ["glb", "gltf"],
    contentType: "model/gltf-binary",
  },
  image: {
    dir: "uploads/thumbnails",
    exts: ["png", "jpg", "jpeg", "webp", "avif", "gif"],
    contentType: null, // keep the uploaded image's content-type
  },
};

function extOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : "";
}

function safeBase(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 40) || "file"
  );
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") ?? "glb";
    const name = url.searchParams.get("name") ?? "file";
    const cfg = KINDS[kind];
    if (!cfg) {
      return NextResponse.json({ error: "unknown kind" }, { status: 400 });
    }
    const ext = extOf(name);
    if (!cfg.exts.includes(ext)) {
      return NextResponse.json(
        { error: `expected a .${cfg.exts.join(" / .")} file` },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await request.arrayBuffer());
    if (bytes.length === 0) {
      return NextResponse.json({ error: "empty file" }, { status: 400 });
    }
    if (bytes.length > MAX_BYTES) {
      return NextResponse.json({ error: "file too large" }, { status: 413 });
    }

    const reqCt = request.headers.get("content-type") || "";
    const contentType =
      cfg.contentType ??
      (reqCt.startsWith("image/") ? reqCt : "application/octet-stream");
    const file = `${safeBase(name)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`${cfg.dir}/${file}`, bytes, {
        access: "public",
        contentType,
      });
      return NextResponse.json({ url: blob.url });
    }

    const dir = path.join(process.cwd(), "public", cfg.dir);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, file), bytes);
    return NextResponse.json({ url: `/${cfg.dir}/${file}` });
  } catch {
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}
