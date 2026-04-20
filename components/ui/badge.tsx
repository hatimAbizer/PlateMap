import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "solid";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] leading-none",
        variant === "default" && "bg-surface-2 text-text border border-border",
        variant === "outline" && "border border-border text-muted",
        variant === "solid" && "text-text",
        className
      )}
      {...props}
    />
  );
}
