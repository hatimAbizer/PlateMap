"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { DIETARY, DIETARY_ORDER } from "@/lib/dietary";
import { cn } from "@/lib/utils";

export function Legend() {
  const [open, setOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 640 : true
  );

  return (
    <div
      className={cn(
        "pointer-events-auto rounded-md border border-border bg-surface/92 backdrop-blur-sm shadow-xl shadow-black/50 overflow-hidden",
        open ? "w-[200px] sm:w-[220px]" : "w-auto"
      )}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 h-8 border-b border-border hover:bg-surface-2 transition-colors"
      >
        <span className="flex items-center gap-1.5 label-xs !text-[9px]">
          <Info className="h-3 w-3" />
          Legend
        </span>
        {open ? (
          <ChevronDown className="h-3 w-3 text-muted" />
        ) : (
          <ChevronUp className="h-3 w-3 text-muted" />
        )}
      </button>

      {open && (
        <ul className="py-1.5 px-1">
          {DIETARY_ORDER.map((k) => (
            <li
              key={k}
              className="flex items-center gap-2.5 px-2 py-1.5"
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-black shrink-0"
                style={{ backgroundColor: DIETARY[k].color }}
                aria-hidden
              />
              <span className="text-xs text-text">{DIETARY[k].label}</span>
            </li>
          ))}
          <li className="flex items-center gap-2.5 px-2 py-1.5 border-t border-border mt-1 pt-2">
            <span className="relative h-3.5 w-3.5 shrink-0" aria-hidden>
              <span
                className="absolute inset-0 rounded-full border border-black"
                style={{
                  background: `linear-gradient(90deg, ${DIETARY.halal.color} 50%, ${DIETARY.veg.color} 50%)`,
                }}
              />
            </span>
            <span className="text-xs text-muted">Multi-category</span>
          </li>
        </ul>
      )}
    </div>
  );
}
