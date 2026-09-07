import { ImageResponse } from "next/og";

// Share card for the landing page — the link most often sent to restaurateurs.
// Warm-editorial: ivory paper, espresso ink, terracotta accent.
export const alt = "Tavola — see your dish, life-size, before you order";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const IVORY = "#f7f2e9";
const INK = "#241e18";
const TERRACOTTA = "#b0563a";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: IVORY,
          color: INK,
          fontFamily: "serif",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: TERRACOTTA,
            fontWeight: 700,
          }}
        >
          True-to-scale AR menu
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginTop: 18,
          }}
        >
          <div style={{ fontSize: 120, fontWeight: 700, lineHeight: 1 }}>
            Tavola
          </div>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              backgroundColor: TERRACOTTA,
              marginLeft: 14,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 38,
            marginTop: 30,
            maxWidth: 900,
            lineHeight: 1.35,
            color: "#5c5347",
          }}
        >
          See every dish at its real size — before you order.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 44,
            backgroundColor: TERRACOTTA,
            color: IVORY,
            borderRadius: 999,
            padding: "16px 34px",
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          Real dimensions · weight · serves · allergens
        </div>
      </div>
    ),
    { ...size },
  );
}
