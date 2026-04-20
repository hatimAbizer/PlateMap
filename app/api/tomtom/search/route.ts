import { NextRequest, NextResponse } from "next/server";
import { tomtomSearch } from "@/lib/tomtom/client";

const BLR = { lat: 12.9716, lng: 77.5946 };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const limitParam = Number(req.nextUrl.searchParams.get("limit"));
  const radiusParam = Number(req.nextUrl.searchParams.get("radius"));
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.floor(limitParam), 1), 100)
    : 8;
  const radius = Number.isFinite(radiusParam)
    ? Math.min(Math.max(Math.floor(radiusParam), 500), 50_000)
    : 25_000;
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await tomtomSearch(q, {
      lat: BLR.lat,
      lng: BLR.lng,
      radius,
      limit,
      countrySet: "IN",
    });
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
