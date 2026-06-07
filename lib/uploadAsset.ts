// Client-side asset upload helper used by the admin (FileUpload, UsdzGenerator).
//
//  - Production (NEXT_PUBLIC_BLOB_ENABLED=true): upload DIRECTLY to Vercel Blob
//    from the browser via @vercel/blob/client. This bypasses the serverless
//    request-body limit (~4.5 MB), so large GLB/USDZ files work. /api/blob-upload
//    only issues a short-lived, auth-checked token.
//  - Dev (no Blob): POST the bytes to the server route, which writes to /public.

export type AssetKind = "glb" | "image" | "usdz";

const DIR: Record<AssetKind, string> = {
  glb: "uploads/models",
  image: "uploads/thumbnails",
  usdz: "models/generated",
};

function extFromName(name: string, fallback: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : fallback;
}

function safeBase(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 40) || "file"
  );
}

export async function uploadAsset(
  file: File | Blob,
  kind: AssetKind,
  filename: string,
): Promise<string> {
  if (process.env.NEXT_PUBLIC_BLOB_ENABLED === "true") {
    const { upload } = await import("@vercel/blob/client");
    const ext = extFromName(filename, kind === "image" ? "bin" : kind);
    const pathname = `${DIR[kind]}/${safeBase(filename)}-${crypto
      .randomUUID()
      .slice(0, 8)}.${ext}`;
    const result = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/blob-upload",
    });
    return result.url;
  }

  // Dev fallback: server route writes the bytes into /public.
  const route = kind === "usdz" ? "/api/usdz" : "/api/upload";
  const qs =
    kind === "usdz"
      ? `?name=${encodeURIComponent(filename)}`
      : `?kind=${kind}&name=${encodeURIComponent(filename)}`;
  const res = await fetch(route + qs, {
    method: "POST",
    headers: {
      "Content-Type":
        (file as File).type ||
        (kind === "usdz" ? "model/vnd.usdz+zip" : "application/octet-stream"),
    },
    body: file,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
  return data.url;
}
