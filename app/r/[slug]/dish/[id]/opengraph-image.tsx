import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { sanitizeHex } from "@/lib/theme";
import { formatPrice, formatDimensions, formatWeight } from "@/lib/format";
import { localizeContent } from "@/lib/i18n";

// Branded social-share card for a dish — name + real portion info + price.
// Uses the English content (clean ASCII, broadest audience).
export const runtime = "nodejs";
export const alt = "Dish preview — Tavola";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const dish = await prisma.dish.findUnique({
    where: { id },
    include: { restaurant: true },
  });

  const brand =
    (dish && sanitizeHex(dish.restaurant.brandColor)) || "#0f766e";
  const valid = dish && dish.restaurant.slug === slug;

  const content = valid
    ? localizeContent(dish, dish.translations, "en")
    : { name: "Tavola", description: null };

  const chips = valid
    ? [
        formatDimensions(dish.widthCm, dish.depthCm, dish.heightCm),
        formatWeight(dish.weightG),
        dish.serves ? `Serves ${dish.serves}` : null,
        dish.calories != null ? `${dish.calories} kcal` : null,
      ].filter((x): x is string => Boolean(x))
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", height: 16, backgroundColor: brand }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "64px 72px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: brand,
                fontWeight: 700,
              }}
            >
              {valid ? dish.restaurant.name : "Tavola"}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 76,
                fontWeight: 800,
                color: "#1c1917",
                marginTop: 16,
                lineHeight: 1.05,
              }}
            >
              {content.name}
            </div>
            {valid && content.description && (
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  color: "#78716c",
                  marginTop: 18,
                  maxWidth: 900,
                }}
              >
                {content.description.length > 110
                  ? content.description.slice(0, 110) + "…"
                  : content.description}
              </div>
            )}
          </div>

          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              {chips.map((c) => (
                <div
                  key={c}
                  style={{
                    display: "flex",
                    backgroundColor: "#f5f5f4",
                    color: "#292524",
                    fontSize: 30,
                    fontWeight: 600,
                    padding: "12px 22px",
                    borderRadius: 999,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 30,
                color: "#78716c",
              }}
            >
              See it life-size in AR before you order
            </div>
            {valid && (
              <div
                style={{
                  display: "flex",
                  fontSize: 56,
                  fontWeight: 800,
                  color: brand,
                }}
              >
                {formatPrice(dish.price, dish.restaurant.currency)}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
