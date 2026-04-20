const TOMTOM_BASE = "https://api.tomtom.com";

export interface TomTomPoi {
  id: string;
  name: string;
  address: string;
  city: string;
  area: string | null;
  country: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  categories: string[];
  score: number;
}

export async function tomtomSearch(
  query: string,
  opts: {
    lat?: number;
    lng?: number;
    radius?: number; // meters
    limit?: number;
    countrySet?: string;
    categorySet?: string;
  } = {}
): Promise<TomTomPoi[]> {
  const key = process.env.TOMTOM_API_KEY || process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
  if (!key) throw new Error("TomTom API key missing");

  const params = new URLSearchParams({
    key,
    limit: String(opts.limit ?? 20),
    countrySet: opts.countrySet ?? "IN",
    typeahead: "true",
    language: "en-IN",
  });
  if (opts.lat != null && opts.lng != null) {
    params.set("lat", String(opts.lat));
    params.set("lon", String(opts.lng));
  }
  if (opts.radius) params.set("radius", String(opts.radius));
  if (opts.categorySet) params.set("categorySet", opts.categorySet);

  const safeQuery = encodeURIComponent(query.trim() || ".");
  const url = `${TOMTOM_BASE}/search/2/search/${safeQuery}.json?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`TomTom search ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as TomTomResponse;
  return (json.results || []).map(mapPoi);
}

export async function tomtomCategorySearch(
  opts: {
    categorySet: string;
    lat: number;
    lng: number;
    radius?: number;
    limit?: number;
  }
): Promise<TomTomPoi[]> {
  const key = process.env.TOMTOM_API_KEY || process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
  if (!key) throw new Error("TomTom API key missing");

  const params = new URLSearchParams({
    key,
    categorySet: opts.categorySet,
    lat: String(opts.lat),
    lon: String(opts.lng),
    radius: String(opts.radius ?? 5000),
    limit: String(opts.limit ?? 100),
    countrySet: "IN",
    language: "en-IN",
  });

  const url = `${TOMTOM_BASE}/search/2/categorySearch/.json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TomTom categorySearch ${res.status}`);
  const json = (await res.json()) as TomTomResponse;
  return (json.results || []).map(mapPoi);
}

interface TomTomResponse {
  results: Array<{
    id: string;
    score: number;
    poi?: {
      name?: string;
      phone?: string;
      url?: string;
      categories?: string[];
      classifications?: Array<{ code: string }>;
    };
    address: {
      freeformAddress?: string;
      localName?: string;
      municipality?: string;
      municipalitySubdivision?: string;
      country?: string;
    };
    position: { lat: number; lon: number };
  }>;
}

function mapPoi(r: TomTomResponse["results"][number]): TomTomPoi {
  return {
    id: r.id,
    name: r.poi?.name ?? r.address.localName ?? "",
    address: r.address.freeformAddress ?? "",
    city: r.address.municipality ?? r.address.localName ?? "",
    area: r.address.municipalitySubdivision ?? null,
    country: r.address.country ?? "",
    lat: r.position.lat,
    lng: r.position.lon,
    phone: r.poi?.phone ?? null,
    website: r.poi?.url ?? null,
    categories: r.poi?.categories ?? [],
    score: r.score,
  };
}
