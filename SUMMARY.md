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
- **Live search** — filter dishes by name + description, composing with the
  diet/allergen chips and result count. _Verified: name + description match,
  empty state, clear-restore._
- **Sticky category quick-nav** — jump between sections on longer menus; tracks
  the filtered groups and only appears with 2+ categories.
- **Allergen & dietary key** — collapsible legend decoding every icon used in
  the menu into its localized label (allergen transparency).
- **Sold-out / "86" treatment** — out-of-stock dishes are greyed with a
  thumbnail overlay + badge on the menu, "(Sold out)" on the printable menu,
  and a banner on the dish page.
- **Contact details** — optional address / phone / website shown in the menu
  footer (tappable `tel:` + website links).
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

### Admin (multi-tenant, auth-gated)
- **User accounts & roles** — email + PBKDF2-hashed password, signup/login,
  signed httpOnly session (`proxy.ts` gates `/admin/*` + upload APIs).
  **OWNER**s see/manage only their own restaurants; platform **ADMIN** sees all;
  every mutation enforces access. _Verified: wrong-pw rejected; owner sees only
  own restaurants and is redirected away from others'._
- **Team invites** — owners share a signed invite link; invitees join as
  **members** (co-manage that restaurant); owner-only Team panel lists/removes
  members. _Verified: no access → join via link → access (no Team panel) →
  owner removes → membership gone._
- **Dish CRUD**, reorder, **duplicate** (clone all metadata + translations),
  **mark sold out (86)** with a one-tap toggle; **category CRUD** (rename +
  translations, reorder, delete → dishes fall back to Uncategorized); settings
  (incl. **logo upload** + **contact details**); **table QR code** +
  **printable branded table card**; **account page** (change name /
  password); **delete restaurant** (owner) / **leave team** (member).
- **Menu health panel** — completeness nudges (verified-to-scale, iOS-AR-ready,
  full portion info, translated) with per-metric "which dishes need work" lists.
- **📐 Measure from 3D model** — reads the GLB bounding box (`getDimensions`),
  auto-fills/validates the stated dimensions.
- **⤴ Upload GLB / thumbnail** + **⤓ Generate USDZ from GLB** — file upload
  (`/api/upload`) and in-browser GLB→USDZ conversion (Three.js
  `GLTFLoader → USDZExporter`), both stored to Vercel Blob (prod) or `/public`
  (dev). _Verified: GLB upload 200 + served; avocado → valid 2.75 MB USDZ._
- **📊 Analytics** — view → AR-launch funnel, per-dish AR rate, and a **7-day
  daily trend chart** (views vs AR launches).
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
- **Auth depth** — accounts (ADMIN/OWNER), ownership, and team invites are in;
  no **password reset** (needs an email provider) or SSO/MFA yet (a managed
  provider like Clerk/NextAuth would add those).
- **AR reference object** — comparator is a 2D bar chart; a to-scale plate
  _inside_ the AR scene is a future nicety.

## ▶️ Top next steps

1. **Source true-to-scale food models** (photogrammetry / AI) — the remaining
   blocker to a real pilot; everything downstream already verifies scale.
2. **Team features** — per-restaurant member invites/roles, password reset,
   email verification (the multi-tenant base is in place).
3. **First-party outcome study** — use the analytics funnel to measure whether
   portion clarity cuts complaints/returns (the proprietary-evidence moat — see
   [`STRATEGY.md`](STRATEGY.md)).
