"use client";

import { useState } from "react";

// model-viewer needs a USDZ for iOS Quick Look. Rather than authoring one by
// hand, we convert the dish's GLB → USDZ right in the browser using Three.js
// (GLTFLoader → USDZExporter, which handles textured models), then persist it
// via /api/usdz and fill the usdzUrl field. Three is dynamically imported so it
// stays out of the initial admin bundle.
//
// This is the in-repo stand-in for the "GLB→USDZ auto-conversion microservice".
type GLTFResult = { scene: import("three").Object3D };

export default function UsdzGenerator({ idPrefix }: { idPrefix: string }) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle",
  );
  const [msg, setMsg] = useState("");

  function input(suffix: string): HTMLInputElement | null {
    return document.getElementById(`${idPrefix}-${suffix}`) as
      | HTMLInputElement
      | null;
  }

  async function generate() {
    const glb = input("glbUrl")?.value?.trim();
    if (!glb) {
      setStatus("error");
      setMsg("Set a GLB model URL first.");
      return;
    }

    setStatus("working");
    setMsg("Loading 3D model…");
    try {
      const [{ GLTFLoader }, { USDZExporter }] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/exporters/USDZExporter.js"),
      ]);

      const res = await fetch(glb);
      if (!res.ok) throw new Error(`Couldn't load the GLB (${res.status}).`);
      const buf = await res.arrayBuffer();

      setMsg("Converting to USDZ…");
      const gltf = await new Promise<GLTFResult>((resolve, reject) => {
        new GLTFLoader().parse(buf, "", resolve, reject);
      });

      // USDZ inherits the model's metres (authored 1 unit = 1 m) → real scale.
      const usdz = await new USDZExporter().parseAsync(gltf.scene);

      setMsg("Saving…");
      const name = glb.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "model";
      const up = await fetch(`/api/usdz?name=${encodeURIComponent(name)}`, {
        method: "POST",
        headers: { "Content-Type": "model/vnd.usdz+zip" },
        body: usdz as BodyInit,
      });
      const data = (await up.json()) as { url?: string; error?: string };
      if (!up.ok || !data.url) throw new Error(data.error ?? "Upload failed.");

      const usdzInput = input("usdzUrl");
      if (usdzInput) usdzInput.value = data.url;
      setStatus("done");
      setMsg(`✓ Generated ${data.url} — iOS AR is now enabled for this dish.`);
    } catch (e) {
      setStatus("error");
      setMsg(e instanceof Error ? e.message : "Conversion failed.");
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={generate}
        disabled={status === "working"}
        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
      >
        {status === "working" ? "Converting…" : "⤓ Generate USDZ from GLB"}
      </button>
      {msg && (
        <p
          className={`mt-1 text-xs ${
            status === "error"
              ? "text-red-600"
              : status === "done"
                ? "text-teal-700"
                : "text-stone-500"
          }`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
