import { ImageResponse } from "next/og";

// Share card for the landing page — the link most often sent to restaurateurs.
// Warm-editorial: ivory paper, espresso ink, terracotta accent.
export const alt = "Tavola: see the dish before you order it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#171614";
const TEAL = "#0f766e";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          color: INK,
          fontFamily: "sans-serif",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>
          tavola
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 112,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -3,
            maxWidth: 980,
          }}
        >
          See the dish before you order it.
        </div>
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              backgroundColor: TEAL,
              color: "#ffffff",
              borderRadius: 14,
              padding: "16px 30px",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            Restaurant menus in 3D, at real size
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
