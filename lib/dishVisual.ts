// Until real food photography exists, menu cards use a tasteful gradient
// placeholder + a food emoji guessed from the dish name. Deterministic so a
// given dish always looks the same.

const EMOJI_RULES: Array<[RegExp, string]> = [
  [/rižot|rizot|risotto|riža|rice/i, "🍚"],
  [/hobotnic|octopus|lignj|squid|kalamar/i, "🐙"],
  [/pljukanc|pasta|njok|gnocc|tjesten/i, "🍝"],
  [/plata|platter|miješan|mijesan|plodov|seafood|škamp|skamp|shrimp/i, "🦐"],
  [/pršut|prsut|sir|cheese|ham|prosciutto/i, "🧀"],
  [/rožat|rozat|custard|krema|desert|slad|cake|kolač|kolac/i, "🍮"],
  [/dagnj|mussel|školjk|skoljk/i, "🦪"],
  [/riba|fish|brancin|orada|tuna/i, "🐟"],
  [/meso|steak|biftek|janjet|lamb|odojak|pork/i, "🥩"],
  [/salat|salad|povrć|povrc|veg/i, "🥗"],
  [/juha|soup|brodet/i, "🍲"],
  [/pizza/i, "🍕"],
  [/vino|wine|piće|pice|drink/i, "🍷"],
];

export function dishEmoji(name: string): string {
  for (const [re, emoji] of EMOJI_RULES) {
    if (re.test(name)) return emoji;
  }
  return "🍽️";
}

const GRADIENTS = [
  "from-amber-100 to-orange-200",
  "from-teal-100 to-emerald-200",
  "from-rose-100 to-pink-200",
  "from-sky-100 to-indigo-200",
  "from-lime-100 to-green-200",
  "from-stone-100 to-amber-100",
];

/** Stable gradient pick from a seed string (e.g. dish id). */
export function dishGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}
