"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Marker, Popup } from "react-leaflet";
import Link from "next/link";
import { ArrowRight, Crosshair, Star } from "lucide-react";

import type { RestaurantRow } from "@/types/database";
import type { DietaryKey } from "@/lib/dietary";
import { DIETARY, dietaryBadgeLabel, primaryDietary } from "@/lib/dietary";
import { FilterPanel } from "./FilterPanel";
import { Legend } from "./Legend";
import { MapSearch } from "./MapSearch";
import { formatCoord, formatRating } from "@/lib/utils";
import { makeClusterIcon, makeRestaurantIcon } from "./marker-icons";
import { cn } from "@/lib/utils";

const BLR_CENTER: [number, number] = [12.9716, 77.5946];
const BLR_ZOOM = 12;

interface MapViewProps {
  restaurants: RestaurantRow[];
}

export default function MapView({ restaurants }: MapViewProps) {
  const [active, setActive] = useState<Record<DietaryKey, boolean>>({
    halal: true,
    veg: true,
    vegan: true,
    jain: true,
  });

  const filtered = useMemo(
    () =>
      restaurants.filter((r) =>
        r.dietary_categories.length === 0
          ? true
          : r.dietary_categories.some((c) => active[c])
      ),
    [restaurants, active]
  );

  const [focused, setFocused] = useState<RestaurantRow | null>(null);

  return (
    <div className="relative h-[calc(100dvh-56px)] w-full overflow-hidden bg-black map-fade-in">
      <MapContainer
        center={BLR_CENTER}
        zoom={BLR_ZOOM}
        minZoom={4}
        maxZoom={19}
        zoomControl={false}
        scrollWheelZoom
        preferCanvas
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
          opacity={0.7}
        />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={makeClusterIcon as any}
          showCoverageOnHover={false}
          maxClusterRadius={48}
          spiderfyOnMaxZoom
        >
          {filtered.map((r) => (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={makeRestaurantIcon(r.dietary_categories, {
                verified: r.is_verified,
              })}
              eventHandlers={{
                click: () => setFocused(r),
              }}
            >
              <Popup closeButton autoPan>
                <MarkerPopup restaurant={r} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        <Recenter />
      </MapContainer>

      {/* Overlay UI */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-4 top-4 sm:left-6 sm:top-6 z-[500]">
          <MapSearch restaurants={restaurants} onFly={setFocused} />
        </div>

        <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-[500]">
          <FilterPanel active={active} onChange={setActive} counts={countsByCat(restaurants)} />
        </div>

        <div className="absolute left-4 bottom-4 sm:left-6 sm:bottom-6 z-[500]">
          <Legend />
        </div>

        <div className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6 z-[500]">
          <LocateControl />
        </div>

        <StatsStrip count={filtered.length} total={restaurants.length} focused={focused} />
      </div>
    </div>
  );
}

function countsByCat(rs: RestaurantRow[]): Record<DietaryKey, number> {
  const out: Record<DietaryKey, number> = { halal: 0, veg: 0, vegan: 0, jain: 0 };
  for (const r of rs) for (const c of r.dietary_categories) out[c]++;
  return out;
}

function MarkerPopup({ restaurant: r }: { restaurant: RestaurantRow }) {
  const primary = primaryDietary(r.dietary_categories);
  return (
    <div className="min-w-[240px] p-4 font-[var(--font-body)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
            {r.area ?? r.city}
          </div>
          <h3 className="font-display text-base font-semibold text-text leading-tight mt-0.5">
            {r.name}
          </h3>
        </div>
        {r.is_verified && (
          <span className="text-[9px] uppercase tracking-[0.16em] font-semibold text-verified border border-verified/40 px-1.5 py-0.5 rounded-sm">
            Verified
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {r.dietary_categories.map((c) => (
          <span
            key={c}
            className="text-[10px] uppercase tracking-[0.14em] font-semibold px-1.5 py-0.5 rounded-sm text-text"
            style={{ backgroundColor: DIETARY[c].color, color: DIETARY[c].textOnColor }}
          >
            {dietaryBadgeLabel(c, r.is_verified)}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1 num text-text">
          <Star className="h-3 w-3 fill-text text-text" />
          {formatRating(r.avg_rating)}
        </span>
        <span className="text-muted num">{r.review_count} reviews</span>
        {r.price_range && <span className="text-muted">{r.price_range}</span>}
      </div>

      {r.cuisine_type && (
        <div className="mt-1.5 text-xs text-muted">{r.cuisine_type}</div>
      )}

      <Link
        href={`/restaurant/${r.slug}`}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-text hover:text-muted transition-colors"
      >
        View details
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function LocateControl() {
  const [busy, setBusy] = useState(false);
  return (
    <LocateButton
      busy={busy}
      onClick={() => {
        setBusy(true);
        // MapFly helper picks this up via event
        window.dispatchEvent(new Event("pm:locate"));
        setTimeout(() => setBusy(false), 1500);
      }}
    />
  );
}

function LocateButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Go to my location"
      className={cn(
        "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-text hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        busy && "opacity-60"
      )}
    >
      <Crosshair className={cn("h-4 w-4", busy && "animate-pulse")} />
    </button>
  );
}

function Recenter() {
  const map = useMap();
  useEffect(() => {
    const onLocate = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, {
            duration: 1.2,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };
    const onFly = (e: Event) => {
      const detail = (e as CustomEvent).detail as { lat: number; lng: number; zoom?: number };
      if (!detail) return;
      map.flyTo([detail.lat, detail.lng], detail.zoom ?? 16, { duration: 1.0 });
    };
    window.addEventListener("pm:locate", onLocate);
    window.addEventListener("pm:fly", onFly as EventListener);
    return () => {
      window.removeEventListener("pm:locate", onLocate);
      window.removeEventListener("pm:fly", onFly as EventListener);
    };
  }, [map]);
  return null;
}

function StatsStrip({
  count,
  total,
  focused,
}: {
  count: number;
  total: number;
  focused: RestaurantRow | null;
}) {
  return (
    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 z-[500]">
      <div className="pointer-events-auto hidden md:flex items-center gap-4 rounded-md border border-border bg-surface/90 backdrop-blur px-4 h-10 text-[11px] uppercase tracking-[0.16em] text-muted">
        <span>
          <span className="num text-text">{count}</span> / {total} shown
        </span>
        <span className="h-4 w-px bg-border" />
        <span>Bengaluru · 12.97°N 77.59°E</span>
        {focused && (
          <>
            <span className="h-4 w-px bg-border" />
            <span className="normal-case tracking-normal text-text">
              {focused.name}
              <span className="text-muted ml-2 num">
                {formatCoord(focused.lat)}, {formatCoord(focused.lng)}
              </span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
