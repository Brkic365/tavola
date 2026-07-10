"use client";

import { useEffect, useRef, useState } from "react";
import { Ruler, BadgeCheck, TriangleAlert, ArrowRight } from "lucide-react";
import { scaleStatus, type ScaleStatus } from "@/lib/scale";

// model-viewer exposes getDimensions() → bounding box in metres (models are
// authored at 1 unit = 1 m, so × 100 gives real centimetres).
type MVElement = HTMLElement & {
  getDimensions?: () => { x: number; y: number; z: number };
};

type Measured = { w: number; d: number; h: number };

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function getInput(id: string): HTMLInputElement | null {
  return document.getElementById(id) as HTMLInputElement | null;
}

function readNum(id: string): number | null {
  const v = getInput(id)?.value?.trim();
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Admin tool that measures the real size of the dish's GLB and (a) lets the
 * operator copy it into the stated dimensions, (b) flags when the stated size
 * doesn't match the model — the integrity check behind "true to scale".
 *
 * It writes the measurement into hidden #<prefix>-modelWidthCm/.. inputs so the
 * server persists it (powering the public "Verified to scale" badge).
 */
export default function DimensionMeasurer({
  idPrefix,
  initialModel,
}: {
  idPrefix: string;
  initialModel?: { w: number | null; d: number | null; h: number | null };
}) {
  const ref = useRef<MVElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  // Bumped on every measure so the <model-viewer> remounts (forces a fresh load
  // even when re-measuring the same URL).
  const [token, setToken] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [measured, setMeasured] = useState<Measured | null>(
    initialModel && initialModel.w && initialModel.d && initialModel.h
      ? { w: initialModel.w, d: initialModel.d, h: initialModel.h }
      : null,
  );
  const [scale, setScale] = useState<ScaleStatus>("unknown");

  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  // If a measurement was already saved (edit form), show its verdict on mount.
  useEffect(() => {
    if (measured) compareToStated(measured);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bind the custom element's load/error events directly (React's onLoad prop
  // doesn't reliably map to a web component's 'load' event).
  useEffect(() => {
    const mv = ref.current;
    if (!mv || !src) return;
    const handleLoad = () => onLoad();
    const handleError = () => setStatus("error");
    mv.addEventListener("load", handleLoad);
    mv.addEventListener("error", handleError);
    return () => {
      mv.removeEventListener("load", handleLoad);
      mv.removeEventListener("error", handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, token]);

  function persist(m: Measured | null) {
    const setHidden = (suffix: string, val: number | null) => {
      const el = getInput(`${idPrefix}-${suffix}`);
      if (el) el.value = val == null ? "" : String(val);
    };
    setHidden("modelWidthCm", m?.w ?? null);
    setHidden("modelDepthCm", m?.d ?? null);
    setHidden("modelHeightCm", m?.h ?? null);
  }

  function compareToStated(m: Measured) {
    setScale(
      scaleStatus(
        {
          w: readNum(`${idPrefix}-widthCm`),
          d: readNum(`${idPrefix}-depthCm`),
          h: readNum(`${idPrefix}-heightCm`),
        },
        m,
      ),
    );
  }

  function startMeasure() {
    const url = getInput(`${idPrefix}-glbUrl`)?.value?.trim();
    if (!url) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMeasured(null);
    setSrc(url);
    setToken((t) => t + 1); // remount the viewer to force a fresh load
  }

  function onLoad() {
    const dims = ref.current?.getDimensions?.();
    if (!dims) {
      setStatus("error");
      return;
    }
    const m: Measured = {
      w: round1(dims.x * 100),
      d: round1(dims.z * 100),
      h: round1(dims.y * 100),
    };
    setMeasured(m);
    setStatus("idle");
    persist(m);
    compareToStated(m);
  }

  function applyToStated() {
    if (!measured) return;
    const set = (suffix: string, val: number) => {
      const el = getInput(`${idPrefix}-${suffix}`);
      if (el) el.value = String(val);
    };
    set("widthCm", measured.w);
    set("depthCm", measured.d);
    set("heightCm", measured.h);
    compareToStated(measured);
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={startMeasure}
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent-soft bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent-strong hover:bg-accent-soft"
        >
          <Ruler className="h-4 w-4" strokeWidth={1.75} />
          Measure from 3D model
        </button>
        {measured && (
          <button
            type="button"
            onClick={applyToStated}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Use measured size
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
        {status === "loading" && (
          <span className="text-sm text-stone-500">Loading model…</span>
        )}
        {status === "error" && (
          <span className="text-sm text-red-600">
            Couldn&apos;t measure — set a valid GLB URL first.
          </span>
        )}
      </div>

      {measured && (
        <div className="mt-2 space-y-1 text-sm">
          <p className="text-stone-600">
            Model measures{" "}
            <strong className="text-stone-900">
              {measured.w} × {measured.d} × {measured.h} cm
            </strong>{" "}
            (W × D × H)
          </p>
          {scale === "verified" && (
            <p className="flex items-center gap-1.5 font-medium text-accent-strong">
              <BadgeCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
              Matches the stated size — this dish is true to scale.
            </p>
          )}
          {scale === "mismatch" && (
            <p className="flex items-start gap-1.5 font-medium text-amber-700">
              <TriangleAlert
                className="mt-0.5 h-4 w-4 shrink-0"
                strokeWidth={1.75}
              />
              <span>
                Doesn&apos;t match the stated size. Tap “Use measured size”, or
                swap in a model authored at 1 unit = 1 metre.
              </span>
            </p>
          )}
          {scale === "unknown" && (
            <p className="text-stone-500">
              Enter the stated W/D/H to check it against the model, or apply the
              measured size.
            </p>
          )}
        </div>
      )}

      {/* The measuring viewport. Kept small; only present while measuring. */}
      {src && (
        <model-viewer
          key={token}
          ref={ref}
          src={src}
          disable-zoom
          interaction-prompt="none"
          loading="eager"
          className="mt-2 block h-36 w-full rounded-lg bg-stone-50"
        />
      )}
    </div>
  );
}
