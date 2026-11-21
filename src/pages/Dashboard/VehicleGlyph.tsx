import type { VehicleKind, VehicleStatus } from "@/components/data/vehicles";
import { getVehicleStatusImage } from "@/lib/vehicleStatusImage";
import { cn } from "@/lib/utils";

type VehicleGlyphProps = {
  kind: VehicleKind;
  status?: VehicleStatus;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** When false, renders only the image without the badge shell. */
  badge?: boolean;
};

const sizeMap = {
  sm: { box: "h-8 w-8", img: "h-7 w-7", radius: "rounded-lg" },
  md: { box: "h-10 w-10", img: "h-9 w-9", radius: "rounded-xl" },
  lg: { box: "h-12 w-12", img: "h-11 w-11", radius: "rounded-2xl" },
} as const;

export function VehicleGlyph({
  kind,
  status = "stopped",
  color = "#22d3ee",
  size = "md",
  className,
  badge = true,
}: VehicleGlyphProps) {
  const dims = sizeMap[size];
  const src = getVehicleStatusImage(kind, status);

  const image = (
    <img
      src={src}
      alt=""
      className={cn("object-contain", dims.img, !badge && className)}
      draggable={false}
    />
  );

  if (!badge) return image;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-transparent",
        dims.box,
        dims.radius,
        className,
      )}
      style={{
        filter: `drop-shadow(0 4px 10px ${color}44)`,
      }}
      aria-hidden
    >
      {image}
    </span>
  );
}
