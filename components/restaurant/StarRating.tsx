"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = 16,
  readonly,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-checked={n === Math.round(value)}
            role="radio"
            className={cn(
              "transition-all",
              readonly ? "cursor-default" : "hover:scale-110"
            )}
          >
            <Star
              width={size}
              height={size}
              strokeWidth={1.5}
              className={cn(
                "transition-colors",
                filled ? "fill-text text-text" : "fill-none text-muted"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
