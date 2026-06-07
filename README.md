# Tavola 🍽️📐

**True-to-scale AR dish preview for restaurant menus.**

A guest scans a QR code at the table, opens the menu, taps a dish, and views it
in **AR at real-world scale** in front of them. The hero value isn't the AR
novelty — it's **portion transparency**: the guest sees how big the dish
actually is, how much it weighs, and how many it serves _before_ ordering. Fewer
"the photo looked bigger" surprises, fewer complaints.

---

## Stack

- **Next.js 16** (App Router) + **TypeScript** (strict) — _the brief specified
  Next 15; `create-next-app` installed the current 16, which uses the same App
  Router APIs._
- **Tailwind CSS v4** — mobile-first, clean light theme, per-restaurant brand
  colour.
- **Prisma + PostgreSQL** — local Postgres via Docker; any Postgres in prod
  (Vercel Postgres / Neon / Supabase).
- **[`@google/model-viewer`](https://modelviewer.dev/)** — in-browser 3D + AR
  (Android Scene Viewer, iOS Quick Look).
- **`qrcode`** — table QR codes in the admin.

## Routes

| Route                 | What                                                                |
| --------------------- | ------------------------------------------------------------------ |
| `/`                   | Landing — lists demo menus, link to admin                          |
| `/r/[slug]`           | **Public mobile menu** — dishes by category, portion badges        |
| `/r/[slug]/dish/[id]` | **Dish detail** — 3D/AR viewer + prominent portion panel           |
| `/admin`              | List / create restaurants                                          |
| `/admin/[slug]`       | Manage a restaurant — dish CRUD, reorder, QR code, AR launch count |
| `/api/ar-view` (POST) | Records an AR launch (analytics)                                    |

---

## Setup & run

> Requires Node 20+ and Docker (for local Postgres).

```bash
cp .env.example .env        # local env (DB url + demo admin creds)
docker compose up -d        # local Postgres on :5432
npm install                 # installs deps (postinstall runs `prisma generate`)
npx prisma migrate deploy   # applies the schema to Postgres
npm run db:seed             # seeds "Konoba Tavola" with 6 dishes
npm run dev                 # http://localhost:3000
```

> On Windows PowerShell use `Copy-Item .env.example .env`. `.env` is gitignored —
> set a strong `ADMIN_SESSION_SECRET` and `ADMIN_PASSWORD` for any real deployment.
> No Docker? Point `DATABASE_URL`/`DIRECT_URL` at any Postgres (e.g. a free Neon DB).

Then open:

- **Menu:** http://localhost:3000/r/tavola-demo
- **Admin:** http://localhost:3000/admin/tavola-demo — **login password:
  `tavola`** (demo; set `ADMIN_PASSWORD` to change)

### Handy scripts

| Script               | Does                                        |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Dev server                                  |
| `npm run build`      | Production build                            |
| `npm run db:migrate` | `prisma migrate dev`                        |
| `npm run db:seed`    | Re-seed (idempotent — wipes & reloads demo) |
| `npm run db:reset`   | Drop, re-migrate, and seed                  |
| `npm run db:studio`  | Prisma Studio (browse the DB)               |

---

## Deploy to Vercel

The app is Vercel-ready (Postgres + Blob; `vercel.json` runs
`prisma generate && prisma migrate deploy && next build`).

1. **Import** the GitHub repo into Vercel (it auto-detects Next.js).
2. **Add Postgres** — Vercel dashboard → _Storage → Create → Postgres_ (Neon).
   Connect it to the project; it injects `POSTGRES_*` vars.
3. **Add Blob** — _Storage → Create → Blob_ (sets `BLOB_READ_WRITE_TOKEN`,
   used for uploaded models/images + generated USDZ). Also set
   **`NEXT_PUBLIC_BLOB_ENABLED=true`** so large uploads go browser→Blob directly
   (bypasses the ~4.5 MB serverless body limit).
4. **Set env vars** (Project → Settings → Environment Variables):
   - `DATABASE_URL` → the **pooled** Postgres URL (`POSTGRES_PRISMA_URL`)
   - `DIRECT_URL` → the **non-pooled** URL (`POSTGRES_URL_NON_POOLING`)
   - `ADMIN_PASSWORD` → your admin password
   - `ADMIN_SESSION_SECRET` → a long random string (`openssl rand -hex 32`)
5. **Deploy.** The build applies migrations automatically.
6. **Seed once** (locally, pointed at the prod DB):
   `DATABASE_URL=<prod-direct-url> DIRECT_URL=<prod-direct-url> npm run db:seed`
   _(skip if you'll create restaurants by hand in `/admin`)._

---

## The AR crux — true scale

Models are placed at **real-world size**, not auto-fitted to the room. That's
what makes the portion preview meaningful. See
[`components/ModelViewer.tsx`](components/ModelViewer.tsx):

```tsx
<model-viewer
  src={glbUrl}            // 3D viewer + Android Scene Viewer
  ios-src={usdzUrl}       // iOS Quick Look (USDZ required)
  ar
  ar-modes="scene-viewer quick-look webxr"
  ar-scale="fixed"        // ← preserve real-world scale; do NOT auto-fit
  camera-controls
  shadow-intensity="1"
>
  <button slot="ar-button">View in your space</button>
</model-viewer>
```

- **Authoring rule:** GLB/USDZ models must be authored at **1 unit = 1 meter**
  so `ar-scale="fixed"` shows the true portion size.
- **Android:** Scene Viewer renders the GLB directly.
- **iOS:** Quick Look needs a **USDZ** via `ios-src`. If a dish has no USDZ, the
  AR button is hidden on iOS automatically while the 3D viewer + dimensions
  still work (graceful degradation). In the seed, only **Dalmatinski pršut i
  sir** ships a USDZ, to exercise the full iOS path.
- AR is only available on phones/tablets — on desktop the AR button is hidden by
  `<model-viewer>` (expected). Test "View in your space" on a real Android
  device.

### Placeholder 3D content

Real food models (photogrammetry/AI) come later. For now `public/models/` holds
free sample GLBs (Khronos glTF Sample Assets + model-viewer shared assets) used
as stand-ins, including the actual **Avocado** food model. They're committed so a
fresh clone works offline.

---

## Data model

`Restaurant → Category → Dish → ArView` (see
[`prisma/schema.prisma`](prisma/schema.prisma)). Portion fields live on `Dish`:
`widthCm`, `depthCm`, `heightCm`, `weightG`, `serves`, plus `glbUrl` /
`usdzUrl`.

## Notes / known stubs

- **Admin auth** is simple password + signed session cookie (`proxy.ts` gates
  `/admin` + `/api/usdz`). Swap in Clerk/NextAuth + per-restaurant roles for
  production — see [`SUMMARY.md`](SUMMARY.md).
- **USDZ** is only present for one seeded dish; others rely on iOS graceful
  fallback. Auto-conversion GLB→USDZ is a planned microservice.
- Menu thumbnails are auto gradient + emoji placeholders until real photography.
