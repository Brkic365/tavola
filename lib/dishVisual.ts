// Menu thumbnail placeholder (until real food photography exists): a food-type
// line icon on a warm tonal tile, chosen deterministically from the dish name.
// Cohesive with the editorial palette — no rainbow gradients, no emoji.

import {
  Soup,
  Fish,
  Wheat,
  Shrimp,
  Ham,
  CakeSlice,
  Shell,
  Beef,
  Salad,
  Pizza,
  Wine,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

const ICON_RULES: Array<[RegExp, LucideIcon]> = [
  [/rižot|rizot|risotto|riža|rice|juha|soup|brodet|grah|stew/i, Soup],
  [/hobotnic|octopus|lignj|squid|kalamar/i, Fish],
  [/pljukanc|pasta|njok|gnocc|tjesten|rezan/i, Wheat],
  [/plata|platter|miješan|mijesan|plodov|seafood|škamp|skamp|shrimp|gambar/i, Shrimp],
  [/pršut|prsut|sir|cheese|ham|prosciutto|panceta/i, Ham],
  [/rožat|rozat|custard|krema|desert|slad|cake|kolač|kolac|torta|sladoled/i, CakeSlice],
  [/dagnj|mussel|školjk|skoljk|ostrig|oyster|clam/i, Shell],
  [/riba|fish|brancin|orada|tuna|losos|salmon|bakalar/i, Fish],
  [/meso|steak|biftek|janjet|lamb|odojak|pork|piletin|chicken|teletin|veal/i, Beef],
  [/salat|salad|povrć|povrc|veg/i, Salad],
  [/pizza|focacc/i, Pizza],
  [/vino|wine|piće|pice|drink|kokte|cocktail|rakij|pivo|beer/i, Wine],
];

export function dishIcon(name: string): LucideIcon {
  for (const [re, Icon] of ICON_RULES) if (re.test(name)) return Icon;
  return UtensilsCrossed;
}

// A few earthy tones that harmonise with the palette (theme-aware via vars where
// possible; olive is a fixed mid-tone that reads on both light and dark tiles).
const TONES = ["var(--accent)", "var(--olive)", "var(--muted)"];

export function dishTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return TONES[hash % TONES.length];
}
