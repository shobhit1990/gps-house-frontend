import type { VehicleKind } from "@/components/data/vehicles";

type VehicleGlyphProps = {
  kind: VehicleKind;
  color: string;
};

export function VehicleGlyph({ kind, color }: VehicleGlyphProps) {
  if (kind === "bike") {
    return (
      <svg viewBox="0 0 78 36" className="h-8 w-16" aria-hidden>
        <circle cx="16" cy="24" r="8" fill="#1f1f1f" />
        <circle cx="16" cy="24" r="4" fill="#d9d9d9" />
        <circle cx="60" cy="24" r="8" fill="#1f1f1f" />
        <circle cx="60" cy="24" r="4" fill="#d9d9d9" />
        <path d="M16 24 L34 12 L48 12 L60 24" stroke={color} strokeWidth="3.2" fill="none" strokeLinejoin="round" />
        <path d="M34 12 L40 20 L52 20" stroke="#222" strokeWidth="2" fill="none" />
        <path d="M30 12 L36 6 L46 6" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="44" cy="16" r="3.2" fill={color} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 84 36" className="h-8 w-[4.25rem]" aria-hidden>
      <ellipse cx="20" cy="27" rx="6.5" ry="6.5" fill="#1c1c1c" />
      <ellipse cx="64" cy="27" rx="6.5" ry="6.5" fill="#1c1c1c" />
      <ellipse cx="20" cy="27" rx="2.6" ry="2.6" fill="#cfcfcf" />
      <ellipse cx="64" cy="27" rx="2.6" ry="2.6" fill="#cfcfcf" />
      <path
        d="M8 25c1-7 6-11 14-12l10-4c6-2 12-2 18 0l16 4c6 2 10 6 12 12v2H8v-2z"
        fill={color}
      />
      <path d="M30 10.5c2 4 6 6 12 6h10c2-3 1-6-2-7l-8-2c-5-1-9 0-12 3z" fill="#b9e4ff" />
      <path d="M14 18h10M60 17h10" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
