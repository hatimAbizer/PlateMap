"use client";

import { Check } from "lucide-react";
import { DIETARY, type DietaryKey, DIETARY_ORDER } from "@/lib/dietary";
import { cn } from "@/lib/utils";

interface Props {
  active: Record<DietaryKey, boolean>;
  onChange: (next: Record<DietaryKey, boolean>) => void;
  counts: Record<DietaryKey, number>;
}

export function FilterPanel({ active, onChange, counts }: Props) {
  const toggle = (k: DietaryKey) => {
    onChange({ ...active, [k]: !active[k] });
  };

  const allOn = DIETARY_ORDER.every((k) => active[k]);

  return (
    <div className="pointer-events-auto w-[188px] sm:w-[220px] rounded-md border border-border bg-surface/92 backdrop-blur-sm shadow-xl shadow-black/50">
      <div className="flex items-center justify-between px-3 h-8 border-b border-border">
        <div className="label-xs !text-[9px]">Filter</div>
        <button
          onClick={() =>
            onChange({
              halal: !allOn,
              veg: !allOn,
              vegan: !allOn,
              jain: !allOn,
            })
          }
          className="text-[9px] uppercase tracking-[0.16em] text-muted hover:text-text transition-colors"
        >
          {allOn ? "Clear" : "All"}
        </button>
      </div>
      <ul className="py-1">
        {DIETARY_ORDER.map((k) => (
          <li key={k}>
            <button
              onClick={() => toggle(k)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left group transition-colors",
                "hover:bg-surface-2"
              )}
              aria-pressed={active[k]}
            >
              <span
                className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border"
                style={{
                  backgroundColor: active[k] ? DIETARY[k].color : "transparent",
                  borderColor: active[k] ? DIETARY[k].color : "hsl(var(--border))",
                }}
              >
                {active[k] && (
                  <Check
                    className="h-3 w-3"
                    strokeWidth={3}
                    style={{ color: DIETARY[k].textOnColor }}
                  />
                )}
              </span>
              <span
                className={cn(
                  "text-xs flex-1",
                  active[k] ? "text-text" : "text-muted"
                )}
              >
                {DIETARY[k].label}
              </span>
              <span className="num text-[10px] text-muted tabular-nums">
                {counts[k]}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
