"use client";

import dynamic from "next/dynamic";
import type { RestaurantRow } from "@/types/database";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

function MapSkeleton() {
  return (
    <div className="relative h-[calc(100dvh-56px)] w-full bg-black overflow-hidden flex items-center justify-center">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted">
        Loading map · Bengaluru
      </div>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 40% 50%, #1f1f1f 0, transparent 50%), radial-gradient(circle at 70% 60%, #151515 0, transparent 40%)",
        }}
      />
    </div>
  );
}

export function MapShell({ restaurants }: { restaurants: RestaurantRow[] }) {
  return <MapView restaurants={restaurants} />;
}
