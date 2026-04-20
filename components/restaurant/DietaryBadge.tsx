import type { DietaryKey } from "@/lib/dietary";
import { DIETARY, dietaryBadgeLabel } from "@/lib/dietary";
import { cn } from "@/lib/utils";

export function DietaryBadge({
  category,
  verified,
  size = "md",
  solid = true,
}: {
  category: DietaryKey;
  verified?: boolean;
  size?: "sm" | "md" | "lg";
  solid?: boolean;
}) {
  const d = DIETARY[category];
  const sizes = {
    sm: "text-[9px] px-1.5 py-0.5 tracking-[0.12em]",
    md: "text-[10px] px-2 py-1 tracking-[0.14em]",
    lg: "text-[11px] px-2.5 py-1.5 tracking-[0.16em]",
  } as const;

  if (!solid) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 uppercase font-semibold border rounded-sm",
          sizes[size]
        )}
        style={{ color: d.color, borderColor: `${d.color}66` }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: d.color }}
        />
        {dietaryBadgeLabel(category, verified)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 uppercase font-semibold rounded-sm",
        sizes[size]
      )}
      style={{ backgroundColor: d.color, color: d.textOnColor }}
    >
      {dietaryBadgeLabel(category, verified)}
    </span>
  );
}
