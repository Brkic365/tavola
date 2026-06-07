"use client";

import { useRef, useState } from "react";
import { uploadAsset } from "@/lib/uploadAsset";

/**
 * Upload a file (GLB model or thumbnail image) and write the resulting URL into
 * a target form input. Stored in Vercel Blob (prod) or /public (dev) via
 * /api/upload — so operators don't have to host assets themselves.
 */
export default function FileUpload({
  targetId,
  kind,
  accept,
  label,
}: {
  targetId: string;
  kind: "glb" | "image";
  accept: string;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    "idle",
  );
  const [msg, setMsg] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setMsg(`Uploading ${file.name}…`);
    try {
      const url = await uploadAsset(file, kind, file.name);
      const target = document.getElementById(targetId) as HTMLInputElement | null;
      if (target) target.value = url;
      setStatus("done");
      setMsg(`✓ Uploaded`);
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
      >
        {status === "uploading" ? "Uploading…" : `⤴ ${label}`}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />
      {msg && (
        <span
          className={`text-xs ${
            status === "error"
              ? "text-red-600"
              : status === "done"
                ? "text-teal-700"
                : "text-stone-500"
          }`}
        >
          {msg}
        </span>
      )}
    </div>
  );
}
