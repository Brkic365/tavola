# Tavola — build summary

A true-to-scale AR restaurant menu. **Hero value: portion transparency** — the
guest sees a dish's real size (life-size in AR), weight, "serves N", calories,
allergens and dietary tags before ordering. Built with Next.js 16 (App Router,
TS strict), Tailwind v4, Prisma + **PostgreSQL**, Google `<model-viewer>`, and
Three.js.

## ✅ Done & verified

### Guest experience
- **Public menu** `/r/[slug]` — brand-coloured header, dishes by category as an
  elegant menu (serif headings), portion badges (serves · size · weight ·
  calories), allergen icons + dietary badges, gradient/emoji thumbnails.
- **Dietary + allergen filtering** — chips to require a diet or exclude an
  allergen (client-side, live count). _Verified: Vegetarian → 2 dishes._
- **Dish detail** — in-browser **3D + AR** via `<model-viewer>`:
  - **True scale** (`ar-scale="fixed"`, models authored 1 unit = 1 m). Android
    Scene Viewer; iOS Quick Look via USDZ with graceful degradation.
  - Our own **"View in your space"** AR button (`activateAR()`) + **AR-launch
    analytics**.
  - **📐 Dimensions toggle** — W/H/D **hotspots** pinned to the bounding box +
    **CAD-style connector lines** synced to the model on camera-change.
  - **Prominent portion panel** + **"Verified to scale"** badge (only when the
    stated size matches the measured model) + **"Size at a glance"** comparator
    (footprint vs card / phone / hand / plate).
- **Multi-language** 🇬🇧🇭🇷🇩🇪🇮🇹 — translated dish content, categories, UI labels,
  and allergen/dietary nouns; flag switcher (cookie) + **per-restaurant default
  language** (guest choice > restaurant default > app default). _Verified
  EN/DE/HR._
- **Accessible / printable** `/r/[slug]/menu` — semantic, no-JS, screen-reader
  + print friendly (the no-smartphone fallback). Skip link, focus rings, SR
  text app-wide.
- **Social-share cards** — dynamic Open Graph images (`next/og`) for menu + dish
  links: a branded card with the dish name, real portion chips and price.
  _Verified by rendering the PNGs._

### Admin (auth-gated)
- **Password auth** — signed httpOnly session cookie, `proxy.ts` gates
  `/admin/*` + `/api/usdz`. _Verified: redirect / 401 / wrong-pw / login /
  logout._
- **Dish CRUD**, reorder, categories, settings, **table QR code**.
- **📐 Measure from 3D model** — reads the GLB bounding box (`getDimensions`),
  auto-fills/validates the stated dimensions.
- **⤴ Upload GLB / thumbnail** + **⤓ Generate USDZ from GLB** — file upload
  (`/api/upload`) and in-browser GLB→USDZ conversion (Three.js
  `GLTFLoader → USDZExporter`), both stored to Vercel Blob (prod) or `/public`
  (dev). _Verified: GLB upload 200 + served; avocado → valid 2.75 MB USDZ._
- **📊 Analytics** — view → AR-launch funnel, per-dish AR rate, last-7-days.
- **Translations editor** (per-locale name/description).

### Platform
- **PostgreSQL** (was SQLite) — Prisma `url` + `directUrl`; single `0_init`
  migration + incremental migrations. _Verified locally against real Postgres._
- **Vercel-ready** — `vercel.json` (`prisma migrate deploy` on build), Vercel
  Blob for USDZ, `docker-compose.yml` for local Postgres, `.env.example` + a
  README deploy runbook.
- **Seed** — Konoba Tavola, 3 categories, 6 Croatian-coast dishes with full
  metadata, EN/DE/IT translations, and a seeded analytics funnel.
- **Build** clean (TS strict). Pushed to GitHub (`.env` purged from history).

## 🔶 Still stubbed / future

- **3D content** — all dishes use placeholder sample GLBs (incl. the real
  Avocado), not actual food. Real models via photogrammetry / AI text→3D later;
  the measured-vs-stated mismatch is surfaced honestly (no false "Verified"
  badge).
- **Thumbnails** — gradient + emoji placeholders (`thumbnailUrl` supported).
- **AI / photo 3D capture** — upload exists (GLB/image/USDZ, with large files
  going **browser→Blob directly** in prod via `NEXT_PUBLIC_BLOB_ENABLED`); the
  remaining gap is generating models (Meshy/Luma/Object Capture), not storing
  them.
- **Auth depth** — single shared admin password; no per-restaurant
  ownership/roles. Swap in Clerk/NextAuth for multi-tenant.
- **AR reference object** — comparator is a 2D bar chart; a to-scale plate
  _inside_ the AR scene is a future nicety.

## ▶️ Top next steps

1. **Source true-to-scale food models** (photogrammetry / AI) — the remaining
   blocker to a real pilot; everything downstream already verifies scale.
2. **Per-restaurant roles + onboarding** (Clerk/NextAuth) for multi-tenant SaaS.
3. **First-party outcome study** — use the analytics funnel to measure whether
   portion clarity cuts complaints/returns (the proprietary-evidence moat — see
   [`STRATEGY.md`](STRATEGY.md)).
