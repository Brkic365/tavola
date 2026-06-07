import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Local placeholder models live in /public/models and are referenced by URL.
// NOTE: these are stand-ins (Khronos / model-viewer sample assets). Real food
// models authored at 1 unit = 1 meter come later via photogrammetry/AI.
const M = (file: string) => `/models/${file}`;

async function main() {
  // Idempotent: wipe and reseed so re-running gives a clean demo state.
  await prisma.arView.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurant.deleteMany();

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Konoba Tavola",
      slug: "tavola-demo",
      brandColor: "#0F766E", // Adriatic teal
      currency: "EUR",
    },
  });

  const predjela = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: "Predjela",
      sortOrder: 0,
      translations: {
        en: { name: "Starters" },
        de: { name: "Vorspeisen" },
        it: { name: "Antipasti" },
      },
    },
  });
  const glavna = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: "Glavna jela",
      sortOrder: 1,
      translations: {
        en: { name: "Main courses" },
        de: { name: "Hauptgerichte" },
        it: { name: "Secondi" },
      },
    },
  });
  const dijeljenje = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: "Za dijeljenje i slatko",
      sortOrder: 2,
      translations: {
        en: { name: "To share & sweet" },
        de: { name: "Zum Teilen & Süßes" },
        it: { name: "Da condividere & dolci" },
      },
    },
  });

  const dishes = [
    {
      categoryId: predjela.id,
      name: "Dalmatinski pršut i sir",
      description:
        "Domaći dalmatinski pršut, paški sir i masline — klasično jadransko predjelo za dijeljenje.",
      price: 14,
      // Only seeded dish with a USDZ → demonstrates the full iOS Quick Look path.
      glbUrl: M("astronaut.glb"),
      usdzUrl: M("astronaut.usdz"),
      widthCm: 28,
      depthCm: 20,
      heightCm: 4,
      weightG: 250,
      serves: "1-2",
      allergens: "dairy",
      featured: false,
      sortOrder: 0,
    },
    {
      categoryId: glavna.id,
      name: "Crni rižot",
      description:
        "Kremasti rižot s sipom i sipinim crnilom, maslinovo ulje i peršin.",
      price: 18,
      glbUrl: M("avocado.glb"),
      usdzUrl: null,
      widthCm: 24,
      depthCm: 24,
      heightCm: 5,
      weightG: 380,
      serves: "1",
      allergens: "molluscs,shellfish",
      featured: true,
      sortOrder: 0,
    },
    {
      categoryId: glavna.id,
      name: "Hobotnica ispod peke",
      description:
        "Hobotnica i krumpir polako pečeni ispod peke s aromatičnim biljem.",
      price: 26,
      glbUrl: M("waterbottle.glb"),
      usdzUrl: null,
      widthCm: 34,
      depthCm: 28,
      heightCm: 9,
      weightG: 900,
      serves: "2-3",
      allergens: "molluscs",
      featured: true,
      sortOrder: 1,
    },
    {
      categoryId: glavna.id,
      name: "Tartufi pljukanci",
      description:
        "Ručno valjani pljukanci s istarskim tartufima i vrhnjem.",
      price: 19,
      glbUrl: M("duck.glb"),
      usdzUrl: null,
      widthCm: 22,
      depthCm: 22,
      heightCm: 6,
      weightG: 320,
      serves: "1",
      allergens: "gluten,dairy,eggs",
      featured: false,
      sortOrder: 2,
    },
    {
      categoryId: dijeljenje.id,
      name: "Miješana plata za 2",
      description:
        "Bogata plata plodova mora — škampi, dagnje, lignje i bijela riba na žaru.",
      price: 48,
      glbUrl: M("boombox.glb"),
      usdzUrl: null,
      widthCm: 40,
      depthCm: 30,
      heightCm: 10,
      weightG: 1400,
      serves: "2",
      allergens: "fish,shellfish,molluscs,crustaceans",
      featured: true,
      sortOrder: 0,
    },
    {
      categoryId: dijeljenje.id,
      name: "Rožata",
      description:
        "Tradicionalni dubrovački kremasti desert s karamelom i notom ruže.",
      price: 7,
      glbUrl: M("avocado.glb"), // reused stand-in
      usdzUrl: null,
      widthCm: 12,
      depthCm: 12,
      heightCm: 6,
      weightG: 160,
      serves: "1",
      allergens: "dairy,eggs",
      featured: false,
      sortOrder: 1,
    },
  ];

  // Real measured bounding boxes of the placeholder GLBs (cm), from
  // model-viewer.getDimensions(). These are stand-ins, so they intentionally do
  // NOT match the stated food dimensions — which is the point: the admin flags
  // the mismatch and no dish gets a false "Verified to scale" badge. Real
  // to-scale food models will verify automatically.
  const MODEL_DIMS: Record<
    string,
    { modelWidthCm: number; modelDepthCm: number; modelHeightCm: number }
  > = {
    "avocado.glb": { modelWidthCm: 4.3, modelDepthCm: 2.8, modelHeightCm: 6.3 },
    "boombox.glb": { modelWidthCm: 2, modelDepthCm: 2, modelHeightCm: 2 },
    "waterbottle.glb": {
      modelWidthCm: 10.9,
      modelDepthCm: 10.9,
      modelHeightCm: 26,
    },
    "duck.glb": { modelWidthCm: 165.5, modelDepthCm: 115.3, modelHeightCm: 154 },
    "astronaut.glb": {
      modelWidthCm: 112,
      modelDepthCm: 72.4,
      modelHeightCm: 201.1,
    },
  };

  // Per-portion calories (UK-style labelling) + dietary tags, by dish name.
  const NUTRITION: Record<string, { calories: number; dietary: string }> = {
    "Dalmatinski pršut i sir": { calories: 520, dietary: "gluten-free" },
    "Crni rižot": { calories: 480, dietary: "gluten-free,pescatarian" },
    "Hobotnica ispod peke": {
      calories: 610,
      dietary: "gluten-free,pescatarian",
    },
    "Tartufi pljukanci": { calories: 720, dietary: "vegetarian" },
    "Miješana plata za 2": {
      calories: 1280,
      dietary: "gluten-free,pescatarian",
    },
    Rožata: { calories: 320, dietary: "vegetarian,gluten-free" },
  };

  // Localized dish content (base content is Croatian). en / de / it.
  const DISH_TRANSLATIONS: Record<
    string,
    Record<string, { name: string; description: string }>
  > = {
    "Dalmatinski pršut i sir": {
      en: {
        name: "Dalmatian prosciutto & cheese",
        description:
          "Home-style Dalmatian prosciutto, Pag cheese and olives — a classic Adriatic sharing starter.",
      },
      de: {
        name: "Dalmatinischer Schinken & Käse",
        description:
          "Hausgemachter dalmatinischer Schinken, Pag-Käse und Oliven — eine klassische adriatische Vorspeise zum Teilen.",
      },
      it: {
        name: "Prosciutto e formaggio dalmati",
        description:
          "Prosciutto dalmata fatto in casa, formaggio di Pag e olive — un classico antipasto adriatico da condividere.",
      },
    },
    "Crni rižot": {
      en: {
        name: "Squid-ink risotto",
        description:
          "Creamy cuttlefish risotto with squid ink, olive oil and parsley.",
      },
      de: {
        name: "Tintenfisch-Risotto",
        description:
          "Cremiges Sepia-Risotto mit Tintenfischtinte, Olivenöl und Petersilie.",
      },
      it: {
        name: "Risotto al nero di seppia",
        description:
          "Risotto cremoso alla seppia con nero di seppia, olio d'oliva e prezzemolo.",
      },
    },
    "Hobotnica ispod peke": {
      en: {
        name: "Octopus under the bell (peka)",
        description:
          "Octopus and potatoes slow-roasted under the peka bell with aromatic herbs.",
      },
      de: {
        name: "Oktopus unter der Glocke (Peka)",
        description:
          "Oktopus und Kartoffeln langsam unter der Peka-Glocke geschmort, mit aromatischen Kräutern.",
      },
      it: {
        name: "Polpo sotto la campana (peka)",
        description:
          "Polpo e patate cotti lentamente sotto la campana peka con erbe aromatiche.",
      },
    },
    "Tartufi pljukanci": {
      en: {
        name: "Pljukanci with truffles",
        description:
          "Hand-rolled pljukanci pasta with Istrian truffles and cream.",
      },
      de: {
        name: "Pljukanci mit Trüffeln",
        description:
          "Handgerollte Pljukanci-Nudeln mit istrischen Trüffeln und Sahne.",
      },
      it: {
        name: "Pljukanci ai tartufi",
        description:
          "Pasta pljukanci fatta a mano con tartufi istriani e panna.",
      },
    },
    "Miješana plata za 2": {
      en: {
        name: "Mixed seafood platter for 2",
        description:
          "A generous seafood platter — prawns, mussels, squid and grilled white fish.",
      },
      de: {
        name: "Gemischte Meeresfrüchteplatte für 2",
        description:
          "Eine üppige Meeresfrüchteplatte — Garnelen, Muscheln, Tintenfisch und gegrillter Weißfisch.",
      },
      it: {
        name: "Grigliata mista di mare per 2",
        description:
          "Un ricco piatto di mare — gamberi, cozze, calamari e pesce bianco alla griglia.",
      },
    },
    Rožata: {
      en: {
        name: "Rožata (custard)",
        description:
          "Traditional Dubrovnik custard dessert with caramel and a hint of rose.",
      },
      de: {
        name: "Rožata (Pudding)",
        description:
          "Traditionelles Dessert aus Dubrovnik mit Karamell und einer Rosennote.",
      },
      it: {
        name: "Rožata (crema)",
        description:
          "Dolce tradizionale di Dubrovnik con caramello e una nota di rosa.",
      },
    },
  };

  let idx = 0;
  for (const d of dishes) {
    const file = d.glbUrl.split("/").pop() ?? "";
    const created = await prisma.dish.create({
      data: {
        restaurantId: restaurant.id,
        ...(MODEL_DIMS[file] ?? {}),
        ...(NUTRITION[d.name] ?? {}),
        translations: DISH_TRANSLATIONS[d.name] ?? undefined,
        ...d,
      },
    });

    // Seed a believable view → AR-launch funnel so the analytics dashboard is
    // populated on a fresh demo (featured dishes get more traffic + AR rate).
    const views = (created.featured ? 16 : 7) + idx * 2;
    const arViews = Math.round(views * (created.featured ? 0.5 : 0.25));
    await prisma.dishView.createMany({
      data: Array.from({ length: views }, () => ({ dishId: created.id })),
    });
    if (arViews > 0) {
      await prisma.arView.createMany({
        data: Array.from({ length: arViews }, () => ({ dishId: created.id })),
      });
    }
    idx++;
  }

  const count = await prisma.dish.count();
  console.log(
    `Seeded "${restaurant.name}" (/r/${restaurant.slug}) with ${count} dishes across 3 categories.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
