import { dishIcon, dishTone } from "@/lib/dishVisual";

type Props = {
  name: string;
  seed: string;
  thumbnailUrl?: string | null;
  className?: string;
};

/**
 * Menu thumbnail. Uses a real photo when one exists; otherwise a food-type line
 * icon on a warm parchment tile — deterministic, cohesive with the editorial
 * palette, and theme-aware. (Real food photography is a later step.)
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

  const Icon = dishIcon(name);
  return (
    <div
      className={`flex h-full w-full items-center justify-center surface-2 ${className}`}
      aria-hidden
    >
      <Icon
        className="h-2/5 w-2/5"
        strokeWidth={1.25}
        style={{ color: dishTone(seed), opacity: 0.85 }}
      />
    </div>
  );
}
