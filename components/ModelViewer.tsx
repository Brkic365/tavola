"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  src: string; // GLB — drives the in-browser viewer + Android Scene Viewer
  iosSrc?: string | null; // USDZ — required for iOS Quick Look
  alt: string;
  dishId: string; // used to log AR launches (analytics)
};

// The bits of the <model-viewer> element API we touch.
type Vec3 = { x: number; y: number; z: number };
type ModelViewerElement = HTMLElement & {
  canActivateAR?: boolean;
  activateAR?: () => Promise<void>;
  getDimensions?: () => Vec3;
  getBoundingBoxCenter?: () => Vec3;
};

// A dimension annotation pinned to a point on the model's bounding box.
type DimHotspot = { slot: string; position: string; label: string };

function cmLabel(metres: number): string {
  const v = Math.round(metres * 100 * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/**
 * Build W/H/D dimension hotspots from the model's REAL bounding box
 * (getDimensions/getBoundingBoxCenter are in metres). Each label is pinned to
 * the midpoint of a bounding-box edge so it reads next to the dish, and the
 * value always matches the geometry actually shown.
 */
function buildDimHotspots(mv: ModelViewerElement): DimHotspot[] | null {
  const d = mv.getDimensions?.();
  const c = mv.getBoundingBoxCenter?.();
  if (!d || !c) return null;
  const hx = d.x / 2;
  const hy = d.y / 2;
  const hz = d.z / 2;
  return [
    // width: bottom-front edge
    {
      slot: "hotspot-dim-w",
      position: `${c.x} ${c.y - hy} ${c.z + hz}`,
      label: `W · ${cmLabel(d.x)} cm`,
    },
    // height: front-right vertical edge
    {
      slot: "hotspot-dim-h",
      position: `${c.x + hx} ${c.y} ${c.z + hz}`,
      label: `H · ${cmLabel(d.y)} cm`,
    },
    // depth: bottom-right edge
    {
      slot: "hotspot-dim-d",
      position: `${c.x + hx} ${c.y - hy} ${c.z}`,
      label: `D · ${cmLabel(d.z)} cm`,
    },
  ];
}

/**
 * TRUE-TO-SCALE AR — the whole point of Tavola.
 *
 * Models MUST be authored at 1 unit = 1 meter, and we pass `ar-scale="fixed"`
 * so <model-viewer> places the dish at its real-world size instead of
 * auto-fitting it to the room. That is what lets a guest judge the actual
 * portion before ordering. Do NOT switch to ar-scale="auto".
 *
 * Platform behaviour:
 *  - Android: Scene Viewer renders the GLB directly (no extra asset needed).
 *  - iOS: Quick Look needs a USDZ via `ios-src`. When a dish has no USDZ we
 *    drop "quick-look" from ar-modes, so AR isn't offered on iOS — the 3D
 *    viewer + dimensions still work (graceful degradation).
 *
 * We render our OWN "View in your space" button (not <model-viewer>'s
 * `slot="ar-button"`) and trigger AR via `activateAR()`. The slotted button
 * lives inside model-viewer's shadow DOM where it is hard to position reliably
 * and can inherit `pointer-events: none`; our button sits in a wrapper we
 * control, so it's positioned and clickable consistently across devices.
 *
 * NOTE: AR launch (Android Scene Viewer / iOS Quick Look) requires the page +
 * model to be served over **HTTPS**. Over plain http (e.g. a LAN IP) the 3D
 * viewer works but the AR handoff is blocked by the OS.
 *
 * TODO: USDZ auto-conversion from GLB — future microservice so every dish
 *       gets iOS AR without manual asset authoring.
 */
export default function ModelViewer({ src, iosSrc, alt, dishId }: Props) {
  const ref = useRef<ModelViewerElement | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [arAvailable, setArAvailable] = useState(false);
  const [dims, setDims] = useState<DimHotspot[] | null>(null);
  const [showDims, setShowDims] = useState(false);

  // The custom element registers itself as a side effect of the import. Loading
  // it in an effect keeps it out of the SSR/server bundle (it touches window).
  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const iOS =
      /iPad|iPhone|iPod/.test(ua) ||
      // iPadOS 13+ reports as Mac but is touch-capable.
      (ua.includes("Macintosh") && "ontouchend" in document);
    setIsIOS(iOS);
  }, []);

  // On model load: (1) reflect AR availability, (2) compute dimension hotspots
  // from the model's real bounding box so the labels always match the geometry.
  useEffect(() => {
    const mv = ref.current;
    if (!mv) return;
    const update = () => setArAvailable(Boolean(mv.canActivateAR));
    const onLoad = () => {
      update();
      setDims(buildDimHotspots(mv));
    };
    mv.addEventListener("load", onLoad);
    const timers = [400, 1200, 2500].map((d) => setTimeout(update, d));
    update();
    return () => {
      mv.removeEventListener("load", onLoad);
      timers.forEach(clearTimeout);
    };
  }, []);

  // Count an AR launch (analytics, best-effort) then hand off to the OS.
  const launchAR = useCallback(() => {
    void fetch("/api/ar-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishId }),
      keepalive: true,
    }).catch(() => {
      /* analytics is best-effort; never block the AR launch */
    });
    void ref.current?.activateAR?.().catch(() => {
      /* user dismissed, or AR unsupported in this context */
    });
  }, [dishId]);

  const hasUSDZ = Boolean(iosSrc);
  // Only advertise quick-look when we actually have a USDZ to feed it.
  const arModes = hasUSDZ
    ? "scene-viewer quick-look webxr"
    : "scene-viewer webxr";
  const iosARUnavailable = isIOS && !hasUSDZ;

  return (
    <div className="w-full">
      {/* our own relative wrapper is the positioning context for the AR button */}
      <div className="relative w-full">
        <model-viewer
          ref={ref}
          src={src}
          ios-src={iosSrc ?? undefined}
          alt={alt}
          ar
          ar-modes={arModes}
          ar-scale="fixed"
          ar-placement="floor"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          exposure="1"
          interaction-prompt="auto"
          loading="eager"
          className="block h-[60vh] max-h-[520px] w-full rounded-2xl bg-stone-100"
          style={{ ["--poster-color" as string]: "#f5f5f4" }}
        >
          {/* Dimension annotations pinned to the model's bounding box. */}
          {showDims &&
            dims?.map((h) => (
              <button
                key={h.slot}
                slot={h.slot}
                data-position={h.position}
                className="pointer-events-none whitespace-nowrap rounded-full border border-stone-200 bg-white/95 px-2 py-0.5 text-xs font-semibold text-stone-800 shadow-md"
              >
                {h.label}
              </button>
            ))}
        </model-viewer>

        {/* Toggle the dimension annotations (appears once the model is loaded). */}
        {dims && (
          <button
            type="button"
            onClick={() => setShowDims((s) => !s)}
            aria-pressed={showDims}
            className={`absolute right-3 top-3 z-10 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 transition ${
              showDims
                ? "bg-teal-700 text-white ring-teal-700"
                : "bg-white/95 text-stone-700 ring-stone-200 hover:bg-white"
            }`}
          >
            📐 {showDims ? "Hide sizes" : "Dimensions"}
          </button>
        )}

        {arAvailable && (
          <button
            type="button"
            onClick={launchAR}
            className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-black/5 transition active:scale-95"
          >
            📐 View in your space
          </button>
        )}
      </div>

      {iosARUnavailable && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          AR preview isn&apos;t available for this dish on iPhone/iPad yet
          (needs a USDZ model). You can still rotate the 3D model above and see
          the real measurements below.
        </p>
      )}
    </div>
  );
}
