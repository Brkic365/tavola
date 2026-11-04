// CC BY 4.0 attribution for the scanned dish models in public/models/dishes.
// Mirrors public/models/dishes/CREDITS.md; the licence requires showing it to
// guests, so the dish page and /credits read from here.

export type ScanCredit = {
  file: string;
  title: string;
  url: string;
  author: string;
  authorUrl: string;
};

export const SCAN_LICENSE = {
  name: "CC BY 4.0",
  url: "https://creativecommons.org/licenses/by/4.0/",
};

export const SCAN_CREDITS: ScanCredit[] = [
  {
    file: "prsut-sir.glb",
    title: "Prosciutto and cheese board",
    url: "https://sketchfab.com/3d-models/prosciutto-and-cheese-board-5350e6ec2afa48ca864cc216fa4af76e",
    author: "alban",
    authorUrl: "https://sketchfab.com/alban",
  },
  {
    file: "crni-rizot.glb",
    title: "Selina Porto - Risoto",
    url: "https://sketchfab.com/3d-models/selina-porto-risoto-53945ab2e8334a77b83628eeca6c25a4",
    author: "hippieandcorporate",
    authorUrl: "https://sketchfab.com/hippieandcorporate",
  },
  {
    file: "hobotnica-peka.glb",
    title: "octopus salad (Food scan)",
    url: "https://sketchfab.com/3d-models/octopus-salad-food-scan-2088b8a02ecc41df8f282d20b41bb288",
    author: "Marcin.Adamski1",
    authorUrl: "https://sketchfab.com/Marcin.Adamski1",
  },
  {
    file: "pljukanci-tartufi.glb",
    title: "Pasta Bowl - Polycam",
    url: "https://sketchfab.com/3d-models/pasta-bowl-polycam-732042b6cff4493eb6281d90e1b46dc1",
    author: "Moshe Caine",
    authorUrl: "https://sketchfab.com/moshecaine",
  },
  {
    file: "plata-za-2.glb",
    title: "Seafood Platter (Scaniverse)",
    url: "https://sketchfab.com/3d-models/seafood-platter-scaniverse-4c0d43fb1c5b402394fbb93cec583e80",
    author: "JFN",
    authorUrl: "https://sketchfab.com/db4",
  },
  {
    file: "rozata.glb",
    title: "Crème Caramel",
    url: "https://sketchfab.com/3d-models/creme-caramel-21c1a9e56e2b48a8aabb91c16903416c",
    author: "Luca Brambilla",
    authorUrl: "https://sketchfab.com/luchino.brambilla96",
  },
];

/** Credit for a dish model URL, when it is one of the bundled scans. */
export function scanCreditFor(glbUrl: string | null | undefined): ScanCredit | null {
  if (!glbUrl) return null;
  const file = glbUrl.split("?")[0].split("/").pop();
  return SCAN_CREDITS.find((c) => c.file === file) ?? null;
}
