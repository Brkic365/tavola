"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ruler, Scan } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

type Props = {
  src: string; // GLB — drives the in-browser viewer + Android Scene Viewer
  iosSrc?: string | null; // USDZ — required for iOS Quick Look
  alt: string;
  dishId: string; // used to log AR launches (analytics)
  locale: Locale;
};

type Vec3 = { x: number; y: number; z: number };
type Hotspot = { x: number; y: number; z: number; toString(): string };
// The bits of the <model-viewer> element API we touch.
type ModelViewerElement = HTMLElement & {
  canActivateAR?: boolean;
  activateAR?: () => Promise<void>;
  getDimensions?: () => Vec3;
  getBoundingBoxCenter?: () => Vec3;
  queryHotspot?: (name: string) => { canvasPosition?: Hotspot } | null;
};

type DimLabel = { slot: string; position: string; label: string };
type DimData = {
  labels: DimLabel[]; // W/H/D text at each edge midpoint
  corners: DimLabel[]; // invisible anchor points for the leader lines
};

// Each connector line runs from the shared front-bottom-right corner along one
// axis. Indices line up with the labels (W, D, H).
const LINES: Array<[string, string]> = [
  ["hotspot-corner-c", "hotspot-corner-w"],
  ["hotspot-corner-c", "hotspot-corner-d"],
  ["hotspot-corner-c", "hotspot-corner-h"],
];

function cmLabel(metres: number): string {
  const v = Math.round(metres * 100 * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/**
 * Build W/H/D dimension annotations from the model's REAL bounding box
 * (getDimensions/getBoundingBoxCenter are in metres), so values + positions
 * always match the geometry actually shown. Labels sit at edge midpoints; the
 * corner anchors drive the SVG leader lines.
 */
function buildDimData(mv: ModelViewerElement): DimData | null {
  const d = mv.getDimensions?.();
  const c = mv.getBoundingBoxCenter?.();
  if (!d || !c) return null;
  const hx = d.x / 2;
  const hy = d.y / 2;
  const hz = d.z / 2;
  const p = (x: number, y: number, z: number) => `${x} ${y} ${z}`;

  return {
    labels: [
      {
        slot: "hotspot-dim-w",
        position: p(c.x, c.y - hy, c.z + hz),
        label: `W · ${cmLabel(d.x)} cm`,
      },
      {
        slot: "hotspot-dim-d",
        position: p(c.x + hx, c.y - hy, c.z),
        label: `D · ${cmLabel(d.z)} cm`,
      },
      {
        slot: "hotspot-dim-h",
        position: p(c.x + hx, c.y, c.z + hz),
        label: `H · ${cmLabel(d.y)} cm`,
      },
    ],
    corners: [
      // shared corner (right-bottom-front)
      { slot: "hotspot-corner-c", position: p(c.x + hx, c.y - hy, c.z + hz), label: "" },
      // width end (−x), depth end (−z), height end (+y)
      { slot: "hotspot-corner-w", position: p(c.x - hx, c.y - hy, c.z + hz), label: "" },
      { slot: "hotspot-corner-d", position: p(c.x + hx, c.y - hy, c.z - hz), label: "" },
      { slot: "hotspot-corner-h", position: p(c.x + hx, c.y + hy, c.z + hz), label: "" },
    ],
  };
}

/**
 * TRUE-TO-SCALE AR — the whole point of Tavola.
 *
 * Models MUST be authored at 1 unit = 1 meter, with `ar-scale="fixed"`, so
 * <model-viewer> places the dish at its real-world size. Do NOT use "auto".
 *
 *  - Android: Scene Viewer renders the GLB directly.
 *  - iOS: Quick Look needs a USDZ via `ios-src`; without one, AR isn't offered
 *    (graceful degradation) — the 3D viewer + dimensions still work.
 *
 * We render our OWN AR button (not the slotted `ar-button`, which is hard to
 * position in shadow DOM) and trigger AR via `activateAR()`.
 *
 * The "Dimensions" toggle overlays W/H/D labels pinned to the bounding box plus
 * CAD-style leader lines drawn in an SVG overlay that we sync to the model's
 * projected positions on every `camera-change`.
 *
 * NOTE: AR launch requires HTTPS; over plain http the viewer works but the OS
 * blocks the AR handoff. TODO: GLB→USDZ is generated in admin (see UsdzGenerator).
 */
export default function ModelViewer({
  src,
  iosSrc,
  alt,
  dishId,
  locale,
}: Props) {
  const ref = useRef<ModelViewerElement | null>(null);
  const lineRefs = useRef<Array<SVGLineElement | null>>([]);
  const [isIOS, setIsIOS] = useState(false);
  const [arAvailable, setArAvailable] = useState(false);
  const [dimData, setDimData] = useState<DimData | null>(null);
  const [showDims, setShowDims] = useState(false);
  const [svg, setSvg] = useState({ w: 0, h: 0 });

  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const iOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (ua.includes("Macintosh") && "ontouchend" in document);
    setIsIOS(iOS);
  }, []);

  // On model load: reflect AR availability + compute dimension data + SVG size.
  useEffect(() => {
    const mv = ref.current;
    if (!mv) return;
    const update = () => setArAvailable(Boolean(mv.canActivateAR));
    const onLoad = () => {
      update();
      setDimData(buildDimData(mv));
      const r = mv.getBoundingClientRect();
      setSvg({ w: r.width, h: r.height });
    };
    mv.addEventListener("load", onLoad);
    const timers = [400, 1200, 2500].map((d) => setTimeout(update, d));
    update();
    return () => {
      mv.removeEventListener("load", onLoad);
      timers.forEach(clearTimeout);
    };
  }, []);

  // Keep the SVG overlay sized to the viewer.
  useEffect(() => {
    const mv = ref.current;
    if (!mv) return;
    const setSize = () => {
      const r = mv.getBoundingClientRect();
      setSvg({ w: r.width, h: r.height });
    };
    window.addEventListener("resize", setSize);
    return () => window.removeEventListener("resize", setSize);
  }, []);

  // Redraw the leader lines from the model's current projected corner positions.
  const syncLines = useCallback(() => {
    const mv = ref.current;
    if (!mv?.queryHotspot) return;
    const at = (slot: string) => mv.queryHotspot?.(slot)?.canvasPosition;
    const c = at("hotspot-corner-c");
    LINES.forEach(([, endSlot], i) => {
      const ln = lineRefs.current[i];
      if (!ln) return;
      const e = at(endSlot);
      if (!c || !e) {
        ln.setAttribute("opacity", "0");
        return;
      }
      ln.setAttribute("x1", String(c.x));
      ln.setAttribute("y1", String(c.y));
      ln.setAttribute("x2", String(e.x));
      ln.setAttribute("y2", String(e.y));
      ln.setAttribute("opacity", "1");
    });
  }, []);

  // While dimensions are shown, resync lines on every camera change.
  useEffect(() => {
    const mv = ref.current;
    if (!mv || !showDims || !dimData) return;
    const onCam = () => syncLines();
    mv.addEventListener("camera-change", onCam);
    const timers = [0, 80, 250, 600].map((d) => setTimeout(syncLines, d));
    return () => {
      mv.removeEventListener("camera-change", onCam);
      timers.forEach(clearTimeout);
    };
  }, [showDims, dimData, syncLines]);

  const launchAR = useCallback(() => {
    void fetch("/api/ar-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishId }),
      keepalive: true,
    }).catch(() => {});
    void ref.current?.activateAR?.().catch(() => {});
  }, [dishId]);

  const hasUSDZ = Boolean(iosSrc);
  const arModes = hasUSDZ
    ? "scene-viewer quick-look webxr"
    : "scene-viewer webxr";
  const iosARUnavailable = isIOS && !hasUSDZ;

  return (
    <div className="w-full">
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
          {showDims &&
            dimData?.labels.map((h) => (
              <button
                key={h.slot}
                slot={h.slot}
                data-position={h.position}
                className="pointer-events-none whitespace-nowrap rounded-full border border-stone-200 bg-white/95 px-2 py-0.5 text-xs font-semibold text-stone-800 shadow-md"
              >
                {h.label}
              </button>
            ))}
          {/* invisible anchors used only to project the leader-line endpoints */}
          {showDims &&
            dimData?.corners.map((h) => (
              <div
                key={h.slot}
                slot={h.slot}
                data-position={h.position}
                className="pointer-events-none h-0 w-0 opacity-0"
              />
            ))}
        </model-viewer>

        {/* CAD-style leader lines, synced to projected corner positions. */}
        {showDims && dimData && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${svg.w || 1} ${svg.h || 1}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            {LINES.map((_, i) => (
              <line
                key={i}
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                stroke="#0f766e"
                strokeWidth={2}
                strokeDasharray="5 3"
                strokeLinecap="round"
                opacity={0}
              />
            ))}
          </svg>
        )}

        {dimData && (
          <button
            type="button"
            onClick={() => setShowDims((s) => !s)}
            aria-pressed={showDims}
            className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 transition ${
              showDims
                ? "bg-brand text-white ring-brand"
                : "bg-white/95 text-stone-700 ring-stone-200 hover:bg-white"
            }`}
          >
            <Ruler className="h-3.5 w-3.5" strokeWidth={1.75} />
            {showDims ? "Hide sizes" : "Dimensions"}
          </button>
        )}

        {arAvailable && (
          <button
            type="button"
            onClick={launchAR}
            className="absolute bottom-4 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-black/5 transition active:scale-95"
          >
            <Scan className="h-4 w-4" strokeWidth={2} />
            {t(locale, "viewInSpace")}
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
