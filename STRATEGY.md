# Tavola — Product, Competition & Roadmap

_Strategy memo. Combines a product analysis of the current MVP with market research
(June 2026). Figures are sourced; vendor-marketing claims are flagged as such._

---

## 1. Product analysis — what Tavola is today

**One-liner:** A no-app, QR-launched mobile menu where each dish is shown **life-size
in AR** with its **real dimensions, weight, and "serves N"** — selling *portion
transparency*, not AR novelty.

### What's built (MVP, verified working)
- Public menu `/r/[slug]`, dish detail with **true-to-scale AR** (`ar-scale="fixed"`,
  model-viewer → Android Scene Viewer / iOS Quick Look), prominent **portion panel**
  (W×D×H, weight, serves), allergen display.
- Admin: restaurant + dish CRUD, reorder, **table QR**, per-restaurant brand theming,
  **AR-launch analytics** (`ArView`).
- Marketing landing page with a live 3D hero. Next.js + Prisma/SQLite; clean,
  mobile-first, light theme.

### Strengths
1. **On-thesis from the data model up.** Dimensions/weight/serves are first-class
   fields, surfaced prominently — the differentiator is structural, not a bolt-on.
2. **True-scale done correctly** (`ar-scale="fixed"`, authored at 1 unit = 1 m).
3. **No-app WebAR + native AR handoff** — low friction; works from a QR.
4. **Allergens already structured** → a compliance hook (see §3).
5. **AR analytics foundation** → the start of a first-party evidence story (see §4).

### Gaps / weaknesses (today)
- **Content pipeline is the whole game and isn't built** — models are placeholders;
  USDZ exists for one dish; no GLB→USDZ conversion; assets are URL strings, no upload.
- **No scale verification.** A dish can *claim* 24 cm while its GLB is any size. For a
  product whose brand IS honesty, **stated dimensions must be derived from / validated
  against the model's real bounding box.** This is currently a credibility hole.
- **No auth** on admin; single-tenant in practice.
- **No ordering/payments** — the exact thing incumbents win on (see §2).
- **No accessibility / no-smartphone fallback** — a documented legal + adoption risk (§3).
- Analytics are shallow (counts only).

---

## 2. Competitive landscape

### 2a. Direct AR/3D menu peers — small, fragmented, "wow"-led
| Player | What | Notes |
|---|---|---|
| **Reliefs** (FR) | WebAR 3D menu, no app | Clearest SaaS analog. **€29/49/89/mo**. Claims "+25% basket / −90% returns" — **vendor-stated, no methodology.** |
| **JARIT / ARLOOPA** | Photogrammetry 3D dish models + white-label app | Active since 2018; quote-based. |
| **ARMenu, MenuAR, AR Code, Menu3** | WebAR 3D-menu point tools | Tiny/regional. AR Code pushes **AI single-photo→3D**. |

**Key structural findings:**
- **The pioneer left the category.** Kabaq (the canonical AR-food brand, photogrammetry
  booth, Bareburger/Snapchat) rebranded **QReal**, was **divested by The Glimpse Group
  (Oct 2024)**, and now does **virtual try-on + "AI photography," not restaurant menus.**
- **Mr Yum folded into me&u (Nov 2023)** → the merged product is QR ordering/CRM, **not
  AR**. (Note: "Mr Yum → Nory" is a common error; Nory is an unrelated AI back-office co.)
- The remaining AR-menu field is **under-capitalized, WebAR-only, and lacks order/pay/POS
  integration** — no breakout winner.

### 2b. Incumbents a restaurant actually uses — none do 3D/AR
- **Order-and-pay / marketing:** **me&u** (~6,000 venues, ~A$2B orders/yr), **Sunday**
  (pay-at-table), **Flipdish**, **BentoBox/Clover**, **UpMenu**, **Tabesto**.
- **POS giants giving QR away (the real gravity):** **Toast**, **Square for Restaurants**,
  **Clover**, **Lightspeed** — QR order-and-pay bundled into the POS, often free.
- **All of them top out at photos.** 3D/AR is genuine white space at the top of the market
  — **but AR alone is not a moat.** The order/pay/guest-data stack the giants give away is
  the competitive gravity; a visual-only product risks being **out-bundled**.

### 2c. The content-cost barrier is collapsing (validates timing, kills the wrong moat)
Historically the #1 reason AR menus failed = **each dish needed a photogrammetry capture +
artist cleanup** (slow, ~$thousands, vendor-dependent), and tableware/sauces/translucent
food photogrammetrize badly. That barrier is falling fast:
- Phone capture: **Apple Object Capture, Polycam, KIRI**.
- **AI text/image-to-3D: Meshy, Luma, Tripo, CSM, Kaedim** ("up to 100× cheaper" 3D).

→ **Implication: the moat is NOT AR rendering (commodity: model-viewer/Quick Look) nor 3D
assets (commoditizing via AI). The moat is the portion-data layer + UX + measured
outcomes.**

---

## 3. Regulatory & demand context (the evidence base)

**Portion is the #1 cause of plate waste (WRAP, n=4,006 UK adults, 2022 — primary source):**
- **48%** leave food because the **portion was too big** (up from 41% in 2012).
- **51%** want more portion-size choice; **53%** want clear info on **sides/garnishes**;
  **63%** worry about wasting food (mainly wasted *money*).
- Peer-reviewed: right-sizing fries **−20.9%** cut **plate waste −66.4%** with no loss of
  satiety. **But** shrinking portions dents value perception (only 32% supported permanent
  smaller fries) → **frame Tavola as expectation-setting, not portion-shrinking.**

**Compliance tailwinds Tavola can ride (a "transparency + compliance two-fer"):**
- **UK calorie law (2022):** 250+ employee operators must show **per-portion kcal** at point
  of choice, **including online/delivery menus**, and **"serves 2–3"** notation on
  shareables — i.e., regulation already speaks Tavola's "serves N" language.
- **EU FIC:** the **14 allergens** must be **written** (not "ask staff"); **Natasha's Law**
  (UK PPDS); **US FASTER Act** added sesame (2023).
- **No jurisdiction mandates size/weight/dimensions** → portion data is *voluntary*
  differentiation (no commoditization), and bundling allergen + per-portion calorie display
  makes Tavola a compliance product too in UK/EU.

**Headwinds (must design around):**
- **QR-menu backlash is real:** only ~31% view QR menus positively; Technomic — 88% prefer
  printed. Backlash is against *bad* (PDF) QR menus → great UX is the counter, but you fight
  acquired skepticism.
- **Accessibility / legal:** ~24% of low-income adults lack smartphones; QR-only menus have
  drawn discrimination complaints; PDF menus fail screen readers. **A no-smartphone /
  accessible fallback is table stakes, not optional.**
- **ROI claims are marketing.** Industry "+25–35% AOV" figures are vendor-sourced and one
  source shows a *decrease*. The credible, conservative mechanism is cart-based upsell
  (~+3% ticket) and photos (~+6.5%/item, up to 70% more orders — Grubhub). **Don't anchor a
  pitch on AR-AOV claims; generate first-party data.**

---

## 4. Strategic position & the wedge

**Positioning:** _"The portion-honest menu — see exactly what you'll get (real size, weight,
servings), life-size, before you order."_ This counter-positions against:
- "appetite-appeal AR" (Reliefs/old Kabaq) — they sell *wow*; Tavola sells *honesty*; and
- "order/pay" incumbents (me&u/Toast/Square) — they don't do visuals at all.

**Why it's defensible:** nobody *leads* with portion truth, the pioneer vacated the space,
AR/3D is commoditizing, and the strongest evidence (WRAP waste/expectation data + UK "serves
X" law) is *on-thesis* and unowned. **The moat to build is the data + outcomes layer:**
1. **Model-validated portion data** (dimensions derived from the actual mesh — trust).
2. **Proprietary outcome evidence** (does transparency cut complaints/returns/waste? — a
   measured study no competitor has).
3. **A reusable dish-model library** (network effect that drives content cost → ~0).

**Go-to-market wedge:** tourist-heavy, higher-ticket Mediterranean dine-in (the
Croatian-coast framing) where portion/value anxiety + language barriers are highest and
"photo looked bigger" complaints are common; **shareable platters** (where "serves N" sells);
and **UK** for the calorie-law compliance two-fer.

**Biggest existential risk:** getting **out-bundled by a POS giant**. Mitigation: **integrate,
don't compete on ordering** — be the *visual/portion layer* that plugs into Toast/Square/
Lightspeed, not a worse order-and-pay clone.

---

## 5. Roadmap

> **Build status (this repo):** ✅ shipped · ◑ partial · ⬜ not started.
> The entire **Now** tier and most of **Next** are shipped — see
> [`SUMMARY.md`](SUMMARY.md). Remaining: real food models, asset-upload
> generalisation, per-restaurant roles, the outcome study, AR reference object.

### Now — harden the wedge, make it pilotable (0–3 mo)
| # | Feature | Why |
|---|---|---|
| ✅ N1 | **Model-derived & validated dimensions** — compute the GLB bounding box (cm), auto-fill W/D/H, flag stated-vs-modeled mismatches | Makes "true-to-scale" actually *true*; closes the credibility hole; core to the brand |
| ◑ N2 | **3D content pipeline** — GLB→USDZ auto-conversion ✅ + GLB/image/USDZ upload→Blob ✅ + AI/photo capture ⬜ | The operational unlock; removes the historical #1 failure mode |
| ✅ N3 | **Dimension hotspots** + connector lines + in-viewer **scale reference** ("Size at a glance") | Portion intuition even without launching AR |
| ✅ N4 | **Auth + roles** — user accounts, restaurant ownership, ADMIN/OWNER (member invites ⬜) | Table stakes for real customers |
| ✅ N5 | **Accessible printable fallback menu** (semantic, WCAG, no-smartphone path) | Legal + adoption risk; counters QR backlash |

### Next — become a *menu*, add the value/compliance layer (3–9 mo)
| # | Feature | Why |
|---|---|---|
| ✅ X1 | **Compliance bundle** — per-portion calories + EU/UK allergen display & dietary tags/filters (veg/vegan/GF/halal) + 2000-kcal statement _(full nutrition macros + search ⬜)_ | Transparency + compliance two-fer; sell into UK 250+ & EU |
| ✅ X2 | **Portion comparator** — "Size at a glance" footprint vs everyday objects | Directly serves the WRAP "want portion choice/clarity" demand |
| ◑ X3 | **First-party analytics** — view→AR-launch funnel ✅; the outcome study (complaints/returns) ⬜ | Builds the proprietary evidence = the real pitch & moat |
| ✅ X4 | **i18n** multi-language menus (EN/HR/DE/IT) | Tourist markets / the Croatian-coast wedge |

### Later — defensibility & expansion (9 mo+)
| # | Feature | Why |
|---|---|---|
| L1 | **POS/ordering integration** (Toast/Square/Lightspeed) or order & pay | Avoid being out-bundled; become the visual layer on top of incumbents |
| L2 | **Reusable 3D dish-model library** (common dishes prebuilt) | Content cost → ~0; data-network moat |
| L3 | **AI portion/nutrition estimation from one photo** | Auto-populate portion + calorie data; minimize operator effort |
| L4 | **Delivery-app surface** (true-scale where "photo looked bigger" is worst) + **food-waste/ESG reporting** (WRAP-aligned) | New channel + B2B sustainability sell |

---

## 6. Metrics to prove the thesis
- **Engagement:** AR-launch rate / dish view, time-in-AR, dish-view→order proxy.
- **Operator:** dishes modeled, time-to-model, content freshness.
- **Outcome (the differentiating data):** complaint/return rate, plate-waste proxy, AOV via
  A/B — *measure what every competitor only claims.*

## 7. Sharpest three takeaways
1. **Lead with trust, and make it real (N1).** The whole brand rests on dimensions being
   true — derive them from the model, or the position collapses.
2. **AR/3D is commoditizing — don't moat on it.** Moat on **portion data + measured outcomes
   + a reusable model library**.
3. **Integrate, don't fight, on ordering.** The POS giants give QR away; be the
   portion/visual layer they lack, not a worse clone they'll out-bundle.

_Sources: WRAP (2022/23); UK Calorie Labelling (OOH) Regs 2021; EU Reg 1169/2011; FDA menu
labeling & FASTER Act; The Glimpse Group divestiture (Oct 2024); me&u/Mr Yum merger (2023);
Reliefs/JARIT/AR Code product pages; Statista/PYMNTS/Technomic QR-adoption data; Grubhub menu-
photo data. AOV/AR-uplift figures are vendor-reported unless noted._
