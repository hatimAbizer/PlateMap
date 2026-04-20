"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function PhotoCarousel({
  photos,
  name,
}: {
  photos: string[];
  name: string;
}) {
  const [idx, setIdx] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="aspect-[16/9] w-full bg-surface flex items-center justify-center border border-border rounded-md">
        <div className="flex flex-col items-center gap-2 text-muted">
          <ImageOff className="h-6 w-6" />
          <span className="text-[10px] uppercase tracking-[0.18em]">No photos yet</span>
        </div>
      </div>
    );
  }

  const next = () => setIdx((i) => (i + 1) % photos.length);
  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-border bg-surface group">
      {photos.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`${name} photo ${i + 1}`}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            i === idx ? "opacity-100" : "opacity-0"
          )}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}

      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-md border border-border bg-surface/80 backdrop-blur flex items-center justify-center text-text opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-md border border-border bg-surface/80 backdrop-blur flex items-center justify-center text-text opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 right-3 flex gap-1">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Photo ${i + 1}`}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === idx ? "w-6 bg-text" : "w-3 bg-text/30"
                )}
              />
            ))}
          </div>
        </>
      )}

      <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.16em] text-text/70 num">
        {idx + 1} / {photos.length}
      </div>
    </div>
  );
}
