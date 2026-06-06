# Tavola — build summary

A working, demoable MVP of a true-to-scale AR restaurant menu. Built with
Next.js 16 (App Router, TS strict), Tailwind v4, Prisma + SQLite, and Google
`<model-viewer>`.

## ✅ Done & verified

**Verified in a real browser** (mobile viewport) against the running dev server:

- **Public menu** `/r/tavola-demo` — restaurant header (brand-coloured),
  dishes grouped by category, each card shows thumbnail, name, price, and
  portion badges (serves / dimensions / weight) + allergen icons. → HTTP 200,
  renders correctly.
- **Dish detail** `/r/[slug]/dish/[id]` — in-browser **3D model loads and
  renders** (`model-viewer` registered, `loaded: true`, `modelIsVisible:
  true`), `ar-scale="fixed"` for true scale, `ios-src` wired to USDZ. Prominent
  **portion panel** (size W×D×H, weight, serves + per-dimension breakdown) and a
  caption near the viewer. Allergens listed.
- **AR**:
  - Android — Scene Viewer launches from the GLB (`ar-modes` includes
    `scene-viewer`).
  - iOS — Quick Look via `ios-src` USDZ; when absent, AR button auto-hidden +
    explanatory note (graceful degradation).
  - AR launch analytics: `POST /api/ar-view` → verified 200 (valid) / 404 (bad
    id) / 400 (missing). Counts surface per-dish in admin.
- **Admin** `/admin` (list + create restaurant) and `/admin/[slug]` (manage):
  settings, categories, **dish CRUD**, reorder (▲▼), and a **table QR code**
  (server-rendered PNG via `qrcode`) + copy link. → Add-dish **create verified**
  end-to-end: new dish persisted with all fields + category, and appeared on the
  public menu (revalidation working).
- **Seed** — idempotent; "Konoba Tavola" (`tavola-demo`), 3 categories, 6
  realistic Croatian-coast dishes with believable dimensions/weight/serves.
- **Build** — `npm run build` passes clean (TypeScript strict, all 7 routes).

## 🔶 Stubbed / deferred (clearly marked in code)

- **Auth** — `/admin` and `/admin/[slug]` are **UNPROTECTED**. `TODO(auth)` at
  the top of [`app/admin/page.tsx`](app/admin/page.tsx) + an on-page warning
  banner. **Add Clerk/NextAuth before any deployment.**
- **USDZ for iOS** — only **one** seeded dish (Dalmatinski pršut) has a USDZ;
  the rest rely on the iOS graceful fallback. `TODO` in
  [`components/ModelViewer.tsx`](components/ModelViewer.tsx): **GLB→USDZ
  auto-conversion microservice**.
- **3D content** — all dishes use placeholder sample GLBs (incl. the real
  Avocado food model), not actual food. Real models via photogrammetry/AI later.
- **Thumbnails** — auto gradient + food-emoji placeholders; `thumbnailUrl`
  supported but unused in seed (no real food photography yet).
- **Asset hosting** — `glbUrl`/`usdzUrl` are URL strings (admin offers the
  bundled models via a datalist + accepts custom URLs). No file-upload pipeline
  yet; the admin "upload" is set-URL.

## ▶️ Top 3 next steps

1. **Add authentication to the admin** (Clerk or NextAuth) + per-restaurant
   ownership/roles. This is the only blocker to a non-public deployment.
2. **Real assets pipeline**: a GLB→USDZ auto-conversion microservice (so every
   dish gets iOS AR), plus a proper model/thumbnail **upload** flow (e.g. S3 /
   blob storage) replacing the URL-string fields.
3. **Source true-to-scale food models** (photogrammetry or AI text→3D) authored
   at 1 unit = 1 m, and add `<model-viewer>` dimension hotspots so the W/D/H are
   annotated directly on the 3D model.

## Stretch goals already included

- ✅ AR-launch analytics (`ArView`) + per-dish counts in admin.
- ✅ Allergen icons on dish cards.
- ✅ Per-restaurant brand-colour theming (light).
- ⬜ model-viewer dimension hotspots (left for next steps).
