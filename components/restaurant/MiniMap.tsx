"use client";

import dynamic from "next/dynamic";
import type { DietaryCategory } from "@/types/database";

const Inner = dynamic(() => import("./MiniMapInner"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[4/3] w-full bg-surface-2 animate-pulse" />
  ),
});

export function MiniMap(props: {
  lat: number;
  lng: number;
  categories: DietaryCategory[];
  verified?: boolean;
}) {
  return <Inner {...props} />;
}
