import { NextRequest, NextResponse } from "next/server";
import { tomtomSearch } from "@/lib/tomtom/client";

const BLR = { lat: 12.9716, lng: 77.5946 };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await tomtomSearch(q, {
      lat: BLR.lat,
      lng: BLR.lng,
      radius: 25_000,
      limit: 8,
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
