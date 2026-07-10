import QRCode from "qrcode";

/**
 * Server-rendered QR code for the public menu URL. The guest scans this at the
 * table to open /r/[slug]. Generated as a data URL with the `qrcode` lib.
 */
export default async function MenuQR({ url }: { url: string }) {
  const dataUrl = await QRCode.toDataURL(url, {
    width: 220,
    margin: 1,
    color: { dark: "#1c1917", light: "#ffffff" },
  });

  return (
    <figure className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={`QR code linking to ${url}`}
        width={180}
        height={180}
        className="rounded-lg bg-white p-2 ring-1 ring-stone-200"
      />
      <a
        href={dataUrl}
        download="tavola-menu-qr.png"
        className="text-xs font-medium text-accent-strong hover:underline"
      >
        Download PNG
      </a>
    </figure>
  );
}
