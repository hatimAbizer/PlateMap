"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, MapPin } from "lucide-react";
import type { RestaurantRow } from "@/types/database";
import { DIETARY, primaryDietary } from "@/lib/dietary";
import { cn } from "@/lib/utils";

interface AreaHit {
  kind: "area";
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}
interface RestaurantHit {
  kind: "restaurant";
  r: RestaurantRow;
}
type Hit = AreaHit | RestaurantHit;

export function MapSearch({
  restaurants,
  onFly,
}: {
  restaurants: RestaurantRow[];
  onFly?: (r: RestaurantRow | null) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [areaHits, setAreaHits] = useState<AreaHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const localHits = useMemo<RestaurantHit[]>(() => {
    if (!q || q.length < 1) return [];
    const needle = q.toLowerCase();
    return restaurants
      .filter(
        (r) =>
          r.name.toLowerCase().includes(needle) ||
          (r.area ?? "").toLowerCase().includes(needle) ||
          (r.cuisine_type ?? "").toLowerCase().includes(needle)
      )
      .slice(0, 6)
      .map((r) => ({ kind: "restaurant", r }));
  }, [q, restaurants]);

  useEffect(() => {
    if (!q || q.length < 2) {
      setAreaHits([]);
      return;
    }
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tomtom/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (Array.isArray(json.results)) {
          setAreaHits(
            json.results.slice(0, 5).map((r: any) => ({
              kind: "area" as const,
              id: r.id,
              name: r.name || r.address.split(",")[0],
              address: r.address,
              lat: r.lat,
              lng: r.lng,
            }))
          );
        }
      } catch {
        setAreaHits([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hits: Hit[] = [...localHits, ...areaHits.map((a) => ({ ...a } as Hit))];

  return (
    <div
      ref={rootRef}
      className="pointer-events-auto w-[min(78vw,380px)] sm:w-[380px] md:w-[420px]"
    >
      <div
        className={cn(
          "flex items-center gap-2 h-11 px-3 rounded-md border border-border bg-surface/92 backdrop-blur-sm shadow-xl shadow-black/60 transition-colors",
          open && "border-text/30"
        )}
      >
        <Search className="h-4 w-4 text-muted shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search restaurants, areas, cuisines…"
          className="flex-1 bg-transparent text-sm text-text placeholder:text-muted outline-none"
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            className="text-muted hover:text-text transition-colors"
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 rounded-sm border border-border text-[10px] font-mono text-muted">
          /
        </kbd>
      </div>

      {open && q && (
        <div className="mt-1.5 rounded-md border border-border bg-surface/96 backdrop-blur-sm shadow-2xl shadow-black/80 max-h-[60vh] overflow-y-auto">
          {hits.length === 0 && !loading && (
            <div className="p-4 text-xs text-muted">
              Nothing found for "<span className="text-text">{q}</span>".
            </div>
          )}

          {localHits.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 label-xs !text-[9px]">Restaurants</div>
              {localHits.map((h) => (
                <button
                  key={h.r.id}
                  onClick={() => {
                    const detail = { lat: h.r.lat, lng: h.r.lng, zoom: 17 };
                    window.dispatchEvent(new CustomEvent("pm:fly", { detail }));
                    onFly?.(h.r);
                    setOpen(false);
                  }}
                  className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
                >
                  <Dot cats={h.r.dietary_categories} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text truncate">{h.r.name}</div>
                    <div className="text-[11px] text-muted truncate">
                      {h.r.area ? `${h.r.area} · ` : ""}
                      {h.r.cuisine_type ?? ""}
                    </div>
                  </div>
                  <Link
                    href={`/restaurant/${h.r.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] uppercase tracking-[0.14em] text-muted hover:text-text"
                  >
                    Open
                  </Link>
                </button>
              ))}
            </div>
          )}

          {areaHits.length > 0 && (
            <div className="border-t border-border">
              <div className="px-3 pt-2 pb-1 label-xs !text-[9px]">Areas</div>
              {areaHits.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("pm:fly", {
                        detail: { lat: a.lat, lng: a.lng, zoom: 15 },
                      })
                    );
                    setOpen(false);
                  }}
                  className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text truncate">{a.name}</div>
                    <div className="text-[11px] text-muted truncate">{a.address}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-muted border-t border-border">
              Searching…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Dot({ cats }: { cats: string[] }) {
  const k = primaryDietary(cats as any);
  if (!k) return <span className="h-3 w-3 rounded-full bg-surface-2 shrink-0 mt-1" />;
  return (
    <span
      className="h-3 w-3 rounded-full shrink-0 mt-1 border border-black"
      style={{ backgroundColor: DIETARY[k].color }}
    />
  );
}
