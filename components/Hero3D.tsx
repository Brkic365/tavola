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
      // Matches the camera the table photo was rendered with (50cm above the
      // table, tilted 40deg down), so the dish sits on the photo convincingly.
      camera-orbit="0deg 50deg 1.02m"
      max-camera-orbit="auto auto 3m"
      camera-target="0m 0m 0m"
      field-of-view="24deg"
      min-field-of-view="10deg"
      auto-rotate
      auto-rotate-delay="0"
      rotation-per-second="8deg"
      environment-image="/landing/restaurant-env.jpg"
      interaction-prompt="none"
      disable-zoom
      disable-pan
      disable-tap
      shadow-intensity="1.8"
      shadow-softness="0.45"
      exposure="1.9"
      tone-mapping="neutral"
      loading="eager"
      className="block h-full w-full"
      style={{
        ["--poster-color" as string]: "transparent",
        background: "transparent",
      }}
    />
  );
}
