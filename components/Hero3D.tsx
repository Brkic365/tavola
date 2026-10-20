"use client";

import { useEffect } from "react";

/**
 * Lightweight 3D showpiece for the landing hero — auto-rotating, no AR button.
 * Demonstrates the product immediately ("show, don't tell"). Shows one of the
 * scanned dishes; the camera stays above the table.
 */
export default function Hero3D({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  return (
    <model-viewer
      src={src}
      alt={alt}
      camera-controls
      camera-orbit="0deg 60deg auto"
      max-camera-orbit="auto 80deg auto"
      auto-rotate
      auto-rotate-delay="0"
      rotation-per-second="24deg"
      interaction-prompt="none"
      disable-zoom
      shadow-intensity="0.8"
      exposure="1.1"
      loading="eager"
      className="h-72 w-full sm:h-96"
      style={{ ["--poster-color" as string]: "transparent" }}
    />
  );
}
