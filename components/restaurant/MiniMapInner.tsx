"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { makeRestaurantIcon } from "@/components/map/marker-icons";
import type { DietaryCategory } from "@/types/database";

export default function MiniMapInner({
  lat,
  lng,
  categories,
  verified,
}: {
  lat: number;
  lng: number;
  categories: DietaryCategory[];
  verified?: boolean;
}) {
  return (
    <div className="aspect-[4/3] w-full">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        style={{ height: "100%", width: "100%", background: "#000" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          attribution='&copy; OSM · CARTO'
        />
        <Marker
          position={[lat, lng]}
          icon={makeRestaurantIcon(categories, { verified })}
        />
      </MapContainer>
    </div>
  );
}
