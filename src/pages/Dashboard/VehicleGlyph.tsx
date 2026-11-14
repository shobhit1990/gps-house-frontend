import { Bike, CarFront } from "lucide-react";
import type { VehicleKind } from "@/components/data/vehicles";
import { cn } from "@/lib/utils";

type VehicleGlyphProps = {
  kind: VehicleKind;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** When false, renders only the icon without the badge shell. */
  badge?: boolean;
};

const sizeMap = {
  sm: { box: "h-8 w-8", icon: "h-3.5 w-3.5", radius: "rounded-lg" },
  md: { box: "h-10 w-10", icon: "h-4.5 w-4.5 h-[18px] w-[18px]", radius: "rounded-xl" },
  lg: { box: "h-12 w-12", icon: "h-5 w-5", radius: "rounded-2xl" },
} as const;

export function VehicleGlyph({
  kind,
  color = "#22d3ee",
  size = "md",
  className,
  badge = true,
}: VehicleGlyphProps) {
  const Icon = kind === "bike" ? Bike : CarFront;
  const dims = sizeMap[size];

  if (!badge) {
    return (
      <Icon
        className={cn(dims.icon, className)}
        style={{ color }}
        strokeWidth={2.1}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
        dims.box,
        dims.radius,
        className,
      )}
      style={{
        background: `linear-gradient(145deg, ${color}cc 0%, ${color}66 45%, #0b1730 100%)`,
        boxShadow: `0 8px 22px ${color}33`,
      }}
      aria-hidden
    >
      <span className="absolute inset-[1px] rounded-[inherit] bg-gradient-to-b from-white/15 to-transparent" />
      <Icon className={cn("relative text-white", dims.icon)} strokeWidth={2.15} />
    </span>
  );
}
