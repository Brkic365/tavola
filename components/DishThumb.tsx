import { dishEmoji, dishGradient } from "@/lib/dishVisual";

type Props = {
  name: string;
  seed: string;
  thumbnailUrl?: string | null;
  className?: string;
};

/**
 * Menu thumbnail. Uses a real photo when one exists; otherwise falls back to a
 * deterministic gradient + food emoji so cards always look intentional.
 * (Real food photography / 3D posters are a later step.)
 */
export default function DishThumb({
  name,
  seed,
  thumbnailUrl,
  className = "",
}: Props) {
  if (thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumbnailUrl}
        alt={name}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${dishGradient(
        seed,
      )} ${className}`}
      aria-hidden
    >
      <span className="text-4xl drop-shadow-sm sm:text-5xl">
        {dishEmoji(name)}
      </span>
    </div>
  );
}
