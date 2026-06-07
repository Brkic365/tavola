import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { sanitizeHex } from "@/lib/theme";

// Branded social-share card for a restaurant's menu.
export const runtime = "nodejs";
export const alt = "Menu — Tavola";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: { _count: { select: { dishes: true } } },
  });

  const brand = (restaurant && sanitizeHex(restaurant.brandColor)) || "#0f766e";
  const name = restaurant?.name ?? "Tavola";
  const count = restaurant?._count.dishes ?? 0;

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
          backgroundColor: brand,
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: 72,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          Menu
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 800,
            marginTop: 12,
            lineHeight: 1.05,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            marginTop: 28,
            opacity: 0.9,
          }}
        >
          {count} dishes · see real portions in AR before you order
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            backgroundColor: "rgba(255,255,255,0.18)",
            borderRadius: 999,
            padding: "14px 28px",
            fontSize: 30,
            fontWeight: 600,
          }}
        >
          True-to-scale AR menu · Tavola
        </div>
      </div>
    ),
    { ...size },
  );
}
