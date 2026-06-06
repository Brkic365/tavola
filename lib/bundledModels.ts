// Placeholder 3D assets shipped under /public/models. Offered as suggestions in
// the admin model pickers so a dish can be wired up without hosting anything.
// Real food models (authored at 1 unit = 1 meter) replace these later.

export const BUNDLED_GLB = [
  { url: "/models/avocado.glb", label: "Avocado (food)" },
  { url: "/models/boombox.glb", label: "BoomBox" },
  { url: "/models/waterbottle.glb", label: "Water Bottle" },
  { url: "/models/duck.glb", label: "Duck" },
  { url: "/models/astronaut.glb", label: "Astronaut (has USDZ)" },
];

// USDZ is only needed for iOS Quick Look. Only the astronaut ships one.
export const BUNDLED_USDZ = [
  { url: "/models/astronaut.usdz", label: "Astronaut" },
];
