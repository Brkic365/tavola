// 3D assets shipped under /public/models. Offered in the admin model pickers so
// a dish can be wired up without hosting anything.

// Scanned food models (1 unit = 1 m), prepared by scripts/blender/import_scans.py;
// see public/models/dishes/CREDITS.md. Each ships a .jpg thumbnail next to the .glb.
export const DISH_LIBRARY = [
  { slug: "prsut-sir", label: "Pršut & cheese board" },
  { slug: "crni-rizot", label: "Black risotto" },
  { slug: "hobotnica-peka", label: "Octopus peka" },
  { slug: "pljukanci-tartufi", label: "Truffle pljukanci" },
  { slug: "plata-za-2", label: "Seafood platter for 2" },
  { slug: "rozata", label: "Rožata" },
].map((m) => ({
  ...m,
  glbUrl: `/models/dishes/${m.slug}.glb`,
  thumbnailUrl: `/models/dishes/${m.slug}.jpg`,
  usdzUrl: `/models/dishes/${m.slug}.usdz`,
}));

/** iOS model for a library GLB, so dishes saved before the USDZ files existed still get iPhone AR. */
export function libraryUsdz(glbUrl: string): string | null {
  return DISH_LIBRARY.find((m) => m.glbUrl === glbUrl)?.usdzUrl ?? null;
}

// Generic sample models (not food).
export const BUNDLED_GLB = [
  ...DISH_LIBRARY.map((m) => ({ url: m.glbUrl, label: m.label })),
  { url: "/models/avocado.glb", label: "Avocado (food)" },
  { url: "/models/boombox.glb", label: "BoomBox" },
  { url: "/models/waterbottle.glb", label: "Water Bottle" },
  { url: "/models/duck.glb", label: "Duck" },
  { url: "/models/astronaut.glb", label: "Astronaut (has USDZ)" },
];

// USDZ is only needed for iOS Quick Look.
export const BUNDLED_USDZ = [
  ...DISH_LIBRARY.map((m) => ({ url: m.usdzUrl, label: m.label })),
  { url: "/models/astronaut.usdz", label: "Astronaut" },
];
