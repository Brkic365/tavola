"use client";

import { useEffect } from "react";

/**
 * The landing page's "AR" screen: a real scanned dish rendered live with
 * model-viewer, sitting on a photo-like table background, so visitors see
 * what a guest sees through their camera. No AR session, no controls (it
 * must not trap page scroll on phones), just a slow turn.
 */
export default function Hero3D({ src, alt }: { src: string; alt: string }) {
  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  return (
    <model-viewer
      src={src}
      alt={alt}
      camera-orbit="20deg 58deg auto"
      field-of-view="26deg"
      auto-rotate
      auto-rotate-delay="0"
      rotation-per-second="10deg"
      interaction-prompt="none"
      disable-zoom
      disable-pan
      disable-tap
      shadow-intensity="1.4"
      shadow-softness="0.6"
      exposure="1.05"
      loading="eager"
      className="block h-full w-full"
      style={{
        ["--poster-color" as string]: "transparent",
        background: "transparent",
      }}
    />
  );
}
