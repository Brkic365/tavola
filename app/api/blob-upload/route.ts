import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Issues short-lived client tokens for direct-to-Blob uploads (large GLB/USDZ
// from the admin). Auth is enforced in onBeforeGenerateToken — NOT via proxy,
// because the second hit (Vercel's upload-completed callback) carries no cookie
// and is instead verified by Blob's own signature.
export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => {
        const token = (await cookies()).get(SESSION_COOKIE)?.value;
        if (!(await verifySessionToken(token))) {
          throw new Error("unauthorized");
        }
        return {
          allowedContentTypes: [
            "model/gltf-binary",
            "model/vnd.usdz+zip",
            "application/octet-stream",
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/avif",
            "image/gif",
          ],
          maximumSizeInBytes: 50 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {
        // The dish save persists the returned URL; nothing to do here.
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "upload failed" },
      { status: 400 },
    );
  }
}
