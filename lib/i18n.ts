// Lightweight i18n. UI strings live in DICT; dish/category content is translated
// via a per-row `translations` JSON column ({ [locale]: { name, description } }).
// Base content (Dish.name/description) is the restaurant's own language.

export const LOCALES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "tavola_lang";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && LOCALES.some((l) => l.code === v);
}

type Dict = Record<string, Record<Locale, string>>;

const DICT: Dict = {
  menu: { en: "Menu", hr: "Jelovnik", de: "Speisekarte", it: "Menù" },
  tagline: {
    en: "See real portions in AR before you order",
    hr: "Vidi stvarne porcije u AR-u prije narudžbe",
    de: "Echte Portionen in AR sehen, bevor du bestellst",
    it: "Vedi le porzioni reali in AR prima di ordinare",
  },
  tapHint: {
    en: "tap any dish to view it life-size",
    hr: "dodirni jelo za prikaz u stvarnoj veličini",
    de: "tippe auf ein Gericht für die Lebensgröße",
    it: "tocca un piatto per vederlo a grandezza naturale",
  },
  printable: {
    en: "Plain-text / printable menu",
    hr: "Tekstualni / ispisivi jelovnik",
    de: "Text- / Druckversion",
    it: "Menù testuale / stampabile",
  },
  interactiveMenu: {
    en: "Interactive AR menu",
    hr: "Interaktivni AR jelovnik",
    de: "Interaktives AR-Menü",
    it: "Menù AR interattivo",
  },
  print: {
    en: "Print this menu",
    hr: "Ispiši jelovnik",
    de: "Menü drucken",
    it: "Stampa il menù",
  },
  scanForMenu: {
    en: "Scan for our menu",
    hr: "Skenirajte naš jelovnik",
    de: "Für unsere Speisekarte scannen",
    it: "Scansiona il nostro menù",
  },
  scanHowto: {
    en: "Point your phone camera at the code to see every dish life-size in AR.",
    hr: "Usmjerite kameru mobitela na kod i vidite svako jelo u stvarnoj veličini u AR-u.",
    de: "Richte deine Handykamera auf den Code, um jedes Gericht in Lebensgröße in AR zu sehen.",
    it: "Inquadra il codice con la fotocamera del telefono per vedere ogni piatto a grandezza naturale in AR.",
  },
  serves: { en: "Serves", hr: "Za", de: "Für", it: "Per" },
  chefsPick: {
    en: "Chef's pick",
    hr: "Izbor kuhara",
    de: "Empfehlung",
    it: "Scelta dello chef",
  },
  chefsPicks: {
    en: "Chef's picks",
    hr: "Izbor kuhara",
    de: "Empfehlungen",
    it: "Scelte dello chef",
  },
  moreDishes: {
    en: "More dishes",
    hr: "Više jela",
    de: "Weitere Gerichte",
    it: "Altri piatti",
  },
  soldOut: {
    en: "Sold out",
    hr: "Rasprodano",
    de: "Ausverkauft",
    it: "Esaurito",
  },
  soldOutNote: {
    en: "Temporarily unavailable",
    hr: "Privremeno nedostupno",
    de: "Vorübergehend nicht verfügbar",
    it: "Temporaneamente non disponibile",
  },
  viewInAr: {
    en: "View in AR",
    hr: "Pogledaj u AR-u",
    de: "In AR ansehen",
    it: "Vedi in AR",
  },
  viewInSpace: {
    en: "View in your space",
    hr: "Pogledaj u svom prostoru",
    de: "In deinem Raum ansehen",
    it: "Vedi nel tuo spazio",
  },
  realPortionSize: {
    en: "Real portion size",
    hr: "Stvarna veličina porcije",
    de: "Echte Portionsgröße",
    it: "Dimensione reale della porzione",
  },
  verifiedToScale: {
    en: "Verified to scale",
    hr: "Mjerilo potvrđeno",
    de: "Maßstabsgetreu",
    it: "Scala verificata",
  },
  size: { en: "Size", hr: "Veličina", de: "Größe", it: "Dimensione" },
  weight: { en: "Weight", hr: "Težina", de: "Gewicht", it: "Peso" },
  width: { en: "Width", hr: "Širina", de: "Breite", it: "Larghezza" },
  depth: { en: "Depth", hr: "Dubina", de: "Tiefe", it: "Profondità" },
  height: { en: "Height", hr: "Visina", de: "Höhe", it: "Altezza" },
  lifeSizeNote: {
    en: "Shown life-size in AR — what you see is the real size on your table.",
    hr: "Prikazano u stvarnoj veličini u AR-u — to je prava veličina na stolu.",
    de: "In AR in Lebensgröße — genau so groß ist es auf deinem Tisch.",
    it: "Mostrato a grandezza naturale in AR — è la dimensione reale sul tavolo.",
  },
  sizeAtGlance: {
    en: "Size at a glance",
    hr: "Veličina na prvi pogled",
    de: "Größe auf einen Blick",
    it: "Dimensione a colpo d'occhio",
  },
  footprintVs: {
    en: "Footprint vs everyday objects",
    hr: "Tlocrt u odnosu na svakodnevne predmete",
    de: "Grundfläche im Vergleich zu Alltagsgegenständen",
    it: "Ingombro rispetto a oggetti di uso quotidiano",
  },
  thisDish: {
    en: "This dish",
    hr: "Ovo jelo",
    de: "Dieses Gericht",
    it: "Questo piatto",
  },
  allergens: {
    en: "Allergens",
    hr: "Alergeni",
    de: "Allergene",
    it: "Allergeni",
  },
  allergenKey: {
    en: "Allergen & dietary key",
    hr: "Oznake alergena i prehrane",
    de: "Allergen- & Ernährungslegende",
    it: "Legenda allergeni e dieta",
  },
  dietary: { en: "Dietary", hr: "Prehrana", de: "Ernährung", it: "Dieta" },
  avoid: { en: "Avoid", hr: "Izbjegni", de: "Vermeiden", it: "Evita" },
  no: { en: "No", hr: "Bez", de: "Ohne", it: "Senza" },
  match: {
    en: "match",
    hr: "odgovara",
    de: "passen",
    it: "corrispondono",
  },
  searchDishes: {
    en: "Search dishes…",
    hr: "Pretraži jela…",
    de: "Gerichte suchen…",
    it: "Cerca piatti…",
  },
  clearSearch: {
    en: "Clear search",
    hr: "Očisti pretragu",
    de: "Suche löschen",
    it: "Cancella ricerca",
  },
  clearFilters: {
    en: "Clear filters",
    hr: "Očisti filtere",
    de: "Filter löschen",
    it: "Azzera filtri",
  },
  noMatch: {
    en: "No dishes match those filters.",
    hr: "Nijedno jelo ne odgovara filterima.",
    de: "Keine Gerichte passen zu diesen Filtern.",
    it: "Nessun piatto corrisponde a questi filtri.",
  },
  caloriesPerPortion: {
    en: "kcal per portion",
    hr: "kcal po porciji",
    de: "kcal pro Portion",
    it: "kcal a porzione",
  },
  kcalStatement: {
    en: "Adults need around 2000 kcal a day.",
    hr: "Odrasloj osobi treba oko 2000 kcal dnevno.",
    de: "Erwachsene benötigen etwa 2000 kcal pro Tag.",
    it: "Un adulto ha bisogno di circa 2000 kcal al giorno.",
  },
  refCard: {
    en: "Credit card",
    hr: "Kartica",
    de: "Kreditkarte",
    it: "Carta di credito",
  },
  refPhone: {
    en: "Smartphone",
    hr: "Mobitel",
    de: "Smartphone",
    it: "Smartphone",
  },
  refHand: { en: "Hand span", hr: "Raspon šake", de: "Handspanne", it: "Mano" },
  refPlate: {
    en: "Dinner plate",
    hr: "Tanjur",
    de: "Teller",
    it: "Piatto",
  },
};

export function t(locale: Locale, key: keyof typeof DICT): string {
  const entry = DICT[key];
  return entry ? (entry[locale] ?? entry.en) : key;
}

export type Translations =
  | Record<string, { name?: string; description?: string } | undefined>
  | null
  | undefined;

/** Resolve a row's localized name/description, falling back to the base. */
export function localizeContent(
  base: { name: string; description?: string | null },
  translations: unknown,
  locale: Locale,
): { name: string; description: string | null } {
  const map = (translations ?? null) as Translations;
  const tr = map && typeof map === "object" ? map[locale] : undefined;
  return {
    name: tr?.name?.trim() || base.name,
    description:
      (tr?.description?.trim() ?? undefined) || base.description || null,
  };
}
