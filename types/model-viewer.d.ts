import type React from "react";

// Minimal JSX typing for Google's <model-viewer> web component
// (@google/model-viewer ships no React types). We declare the attributes we
// use; boolean attributes (ar, camera-controls…) are presence-based, so any
// truthy value enables them. The index signature keeps it permissive.
interface ModelViewerAttributes extends React.HTMLAttributes<HTMLElement> {
  src?: string;
  "ios-src"?: string;
  poster?: string;
  alt?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "ar-scale"?: "auto" | "fixed";
  "ar-placement"?: "floor" | "wall";
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  "disable-zoom"?: boolean;
  "shadow-intensity"?: string | number;
  "camera-orbit"?: string;
  "min-camera-orbit"?: string;
  "max-camera-orbit"?: string;
  "field-of-view"?: string;
  exposure?: string | number;
  "environment-image"?: string;
  "interaction-prompt"?: "auto" | "none";
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "interaction" | "manual";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}
