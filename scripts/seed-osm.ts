import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  buildDietaryClaimStatus,
  inferDietaryCategoriesFromMetadata,
  type DietaryKey,
  DIETARY_ORDER,
} from "../lib/dietary";
import { slugify } from "../lib/utils";

config({ path: ".env.local" });
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BBOX = {
  minLat: numEnv("OSM_MIN_LAT", 12.85),
  maxLat: numEnv("OSM_MAX_LAT", 13.08),
  minLng: numEnv("OSM_MIN_LNG", 77.45),
  maxLng: numEnv("OSM_MAX_LNG", 77.75),
};

const LIMIT = numEnv("OSM_LIMIT", 0); // 0 = no cap
const DRY_RUN = /^(1|true)$/i.test(process.env.OSM_DRY_RUN ?? "");
const REQUIRE_DIETARY = /^(1|true)$/i.test(process.env.OSM_REQUIRE_DIETARY ?? "1");
const TILE_ROWS = intEnv("OSM_TILE_ROWS", 3);
const TILE_COLS = intEnv("OSM_TILE_COLS", 3);
const RETRIES = intEnv("OSM_RETRIES", 3);
const MATCH_DISTANCE_METERS = numEnv("OSM_MATCH_DISTANCE_METERS", 200);
const ENDPOINTS = (
  process.env.OSM_OVERPASS_URLS ??
  process.env.OSM_OVERPASS_URL ??
  "https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter"
)
  .split(",")
  .map((endpoint) => endpoint.trim())
  .filter(Boolean);

type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type TileBBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

type SeedPayload = {
  slug: string;
  name: string;
  address: string;
  city: string;
  area: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  cuisine_type: string | null;
  dietary_categories: DietaryKey[];
  dietary_claim_status: Partial<Record<DietaryKey, "unverified" | "verified">>;
  is_verified: boolean;
  photos: string[];
  osm_id?: string;
};

type ExistingRestaurantRow = {
  id: string;
  name: string;
  address: string | null;
  area: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  cuisine_type: string | null;
  dietary_categories: DietaryKey[];
  dietary_claim_status: Partial<Record<DietaryKey, "unverified" | "verified">> | null;
  is_verified: boolean;
  claimed_by: string | null;
  osm_id: string | null;
};

async function main() {
  const hasOsmId = await columnExists("restaurants", "osm_id");
  if (!hasOsmId) {
    console.warn(
      "⚠ restaurants.osm_id column missing. Apply supabase/migrations/0005_add_osm_id.sql first for idempotent re-seeding. Continuing without it."
    );
  }

  const tiles = splitBBox(BBOX, TILE_ROWS, TILE_COLS);
  const maxRetries = Math.max(1, RETRIES);
  console.log(
    `Querying Overpass across ${tiles.length} tile(s), ${ENDPOINTS.length} endpoint(s), retries=${maxRetries}...`
  );
  const t0 = Date.now();

  const elements: OsmElement[] = [];
  const seenElements = new Set<string>();

  for (let idx = 0; idx < tiles.length; idx++) {
    const tile = tiles[idx];
    const query = buildQuery(tile);
    const tileElements = await fetchOverpassElements(query, idx + 1, tiles.length);
    for (const el of tileElements) {
      const key = `${el.type}/${el.id}`;
      if (seenElements.has(key)) continue;
      seenElements.add(key);
      elements.push(el);
    }
    console.log(`... tile ${idx + 1}/${tiles.length}: +${tileElements.length} raw, ${elements.length} unique`);
  }

  console.log(`Fetched ${elements.length} elements in ${Date.now() - t0}ms.`);

  let skippedInvalid = 0;
  let skippedNoDietary = 0;
  const cap = LIMIT > 0 ? Math.min(elements.length, LIMIT) : elements.length;
  const payloads: SeedPayload[] = [];
  const seenSlugs = new Set<string>();

  for (let i = 0; i < cap; i++) {
    const el = elements[i];
    const tags = el.tags ?? {};
    const name = (tags.name ?? tags["name:en"] ?? "").trim();
    if (!name) {
      skippedInvalid++;
      continue;
    }
    const lat = el.type === "node" ? el.lat : el.center?.lat;
    const lng = el.type === "node" ? el.lon : el.center?.lon;
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      skippedInvalid++;
      continue;
    }

    const osmId = `${el.type}/${el.id}`;
    const dietary = classifyDietary(tags, name);
    if (REQUIRE_DIETARY && dietary.length === 0) {
      skippedNoDietary++;
      continue;
    }

    const addressParts = [
      tags["addr:housenumber"],
      tags["addr:street"],
      tags["addr:suburb"] ?? tags["addr:neighbourhood"],
      tags["addr:city"],
    ]
      .filter(Boolean)
      .join(", ");

    const area =
      tags["addr:suburb"] ||
      tags["addr:neighbourhood"] ||
      tags["addr:quarter"] ||
      null;

    const slugBase = slugify(name) || "restaurant";
    const slug = `${slugBase}-${el.type[0]}${el.id}`.slice(0, 120);
    if (seenSlugs.has(slug)) {
      skippedInvalid++;
      continue;
    }
    seenSlugs.add(slug);

    const cuisine = normalizeCuisine(tags.cuisine);
    const phone = (tags.phone ?? tags["contact:phone"] ?? "").trim() || null;
    const website = (tags.website ?? tags["contact:website"] ?? "").trim() || null;

    const payload: SeedPayload = {
      slug,
      name,
      address: addressParts || "Bengaluru",
      city: "Bengaluru",
      area,
      lat,
      lng,
      phone,
      website,
      cuisine_type: cuisine,
      dietary_categories: dietary,
      dietary_claim_status: buildDietaryClaimStatus(dietary, "unverified"),
      is_verified: false,
      photos: [],
    };
    if (hasOsmId) payload.osm_id = osmId;

    payloads.push(payload);
  }

  if (DRY_RUN) {
    console.log(
      `Dry run: would insert ${payloads.length}, invalid ${skippedInvalid}, no-dietary ${skippedNoDietary}.`
    );
    return;
  }

  console.log(`Merging ${payloads.length} OSM rows into restaurants...`);
  let mergedByOsmId = 0;
  let mergedByName = 0;
  let mergedRows = 0;
  let protectedRows = 0;
  let mergeErrors = 0;
  const inserts: SeedPayload[] = [];

  for (const payload of payloads) {
    let existing: ExistingRestaurantRow | null = null;

    if (hasOsmId && payload.osm_id) {
      existing = await findByOsmId(payload.osm_id);
      if (existing) mergedByOsmId++;
    }

    if (!existing) {
      existing = await findBestNearbyMatch(payload, MATCH_DISTANCE_METERS);
      if (existing) mergedByName++;
    }

    if (!existing) {
      inserts.push(payload);
      continue;
    }

    if (existing.is_verified || existing.claimed_by) {
      protectedRows++;
      continue;
    }

    const updates = buildMergeUpdate(existing, payload, hasOsmId);
    if (!updates) continue;

    const { error } = await supabase.from("restaurants").update(updates).eq("id", existing.id);
    if (error) {
      mergeErrors++;
      console.error(`Merge ${existing.id} ↯ ${error.message}`);
      continue;
    }
    mergedRows++;
  }

  console.log(`Inserting ${inserts.length} new rows in batches...`);
  const BATCH = 500;
  let onConflict = hasOsmId ? "osm_id" : "slug";
  let inserted = 0;
  let insertErrors = 0;

  for (let i = 0; i < inserts.length; i += BATCH) {
    const batch = inserts.slice(i, i + BATCH);
    let { error } = await supabase.from("restaurants").upsert(batch, { onConflict, ignoreDuplicates: true });
    if (
      error &&
      onConflict === "osm_id" &&
      /no unique or exclusion constraint matching the ON CONFLICT specification/i.test(error.message)
    ) {
      console.warn(
        "restaurants.osm_id has no unique constraint; apply supabase/migrations/0006_fix_source_id_uniques.sql. Falling back to slug conflict handling."
      );
      onConflict = "slug";
      const retry = await supabase.from("restaurants").upsert(batch, { onConflict, ignoreDuplicates: true });
      error = retry.error;
    }
    if (error) {
      insertErrors++;
      console.error(`Batch ${i}-${i + batch.length} ↯ ${error.message}`);
      continue;
    }
    inserted += batch.length;
    console.log(`... ${inserted}/${inserts.length}`);
  }

  console.log(
    `Done. Merged ${mergedRows} (osm-id ${mergedByOsmId}, name+distance ${mergedByName}), inserted ${inserted}, protected ${protectedRows}, merge errors ${mergeErrors}, insert errors ${insertErrors}, invalid ${skippedInvalid}, no-dietary ${skippedNoDietary}.`
  );
}

function buildQuery(bbox: TileBBox): string {
  return `
    [out:json][timeout:180];
    (
      node["amenity"~"^(restaurant|cafe|fast_food|food_court|ice_cream)$"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
      way["amenity"~"^(restaurant|cafe|fast_food|food_court|ice_cream)$"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
    );
    out center tags;
  `.trim();
}

async function fetchOverpassElements(
  query: string,
  tileIndex: number,
  tileCount: number
): Promise<OsmElement[]> {
  if (ENDPOINTS.length === 0) {
    throw new Error("No Overpass endpoint configured.");
  }

  const maxAttempts = ENDPOINTS.length * Math.max(1, RETRIES);
  let lastError = "No attempts made.";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const endpoint = ENDPOINTS[attempt % ENDPOINTS.length];
    const attemptNum = attempt + 1;
    try {
      const body = new URLSearchParams({ data: query });
      const res = await fetch(endpoint, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "PlateMap/1.0 (seed-osm)",
        },
      });
      const text = await res.text();
      if (!res.ok) {
        lastError = `HTTP ${res.status} from ${endpoint}: ${truncate(text)}`;
        if (attemptNum < maxAttempts && shouldRetry(res.status, text)) {
          console.warn(
            `Tile ${tileIndex}/${tileCount}: retrying (${attemptNum}/${maxAttempts}) after ${res.status} from ${endpoint}.`
          );
          await sleep(backoffMs(attemptNum));
          continue;
        }
        throw new Error(lastError);
      }
      const json = JSON.parse(text) as { elements?: OsmElement[] };
      return json.elements ?? [];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastError = `${endpoint} failed: ${message}`;
      if (attemptNum >= maxAttempts) break;
      console.warn(`Tile ${tileIndex}/${tileCount}: retrying (${attemptNum}/${maxAttempts}) after ${message}`);
      await sleep(backoffMs(attemptNum));
    }
  }

  throw new Error(`Overpass failed for tile ${tileIndex}/${tileCount}: ${lastError}`);
}

function splitBBox(bbox: TileBBox, rows: number, cols: number): TileBBox[] {
  const safeRows = Math.max(1, Math.floor(rows));
  const safeCols = Math.max(1, Math.floor(cols));
  const latSpan = bbox.maxLat - bbox.minLat;
  const lngSpan = bbox.maxLng - bbox.minLng;
  const tiles: TileBBox[] = [];

  for (let r = 0; r < safeRows; r++) {
    const minLat = bbox.minLat + (latSpan * r) / safeRows;
    const maxLat = bbox.minLat + (latSpan * (r + 1)) / safeRows;
    for (let c = 0; c < safeCols; c++) {
      const minLng = bbox.minLng + (lngSpan * c) / safeCols;
      const maxLng = bbox.minLng + (lngSpan * (c + 1)) / safeCols;
      tiles.push({ minLat, maxLat, minLng, maxLng });
    }
  }

  return tiles;
}

function shouldRetry(status: number, body: string): boolean {
  if (status === 429 || status === 504 || status >= 500) return true;
  const text = body.toLowerCase();
  return text.includes("too busy") || text.includes("timeout");
}

function backoffMs(attemptNum: number): number {
  const capped = Math.min(attemptNum, 6);
  return 1000 * 2 ** capped;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function truncate(input: string, max = 240): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max)}...`;
}

async function findByOsmId(osmId: string): Promise<ExistingRestaurantRow | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "id,name,address,area,lat,lng,phone,website,cuisine_type,dietary_categories,dietary_claim_status,is_verified,claimed_by,osm_id"
    )
    .eq("osm_id", osmId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ExistingRestaurantRow;
}

async function findBestNearbyMatch(
  payload: SeedPayload,
  maxDistanceMeters: number
): Promise<ExistingRestaurantRow | null> {
  const delta = latLngDelta(payload.lat, maxDistanceMeters);
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "id,name,address,area,lat,lng,phone,website,cuisine_type,dietary_categories,dietary_claim_status,is_verified,claimed_by,osm_id"
    )
    .gte("lat", payload.lat - delta.lat)
    .lte("lat", payload.lat + delta.lat)
    .gte("lng", payload.lng - delta.lng)
    .lte("lng", payload.lng + delta.lng)
    .limit(60);

  if (error || !data || data.length === 0) return null;

  const sourceName = normalizePlaceName(payload.name);
  let best: ExistingRestaurantRow | null = null;
  let bestScore = 0;

  for (const row of data as ExistingRestaurantRow[]) {
    const distance = haversineMeters(payload.lat, payload.lng, row.lat, row.lng);
    if (distance > maxDistanceMeters) continue;
    const nameScore = nameSimilarity(sourceName, normalizePlaceName(row.name));
    if (nameScore < 0.72) continue;
    const distanceScore = 1 - distance / maxDistanceMeters;
    const score = nameScore * 0.85 + distanceScore * 0.15;
    if (score > bestScore) {
      best = row;
      bestScore = score;
    }
  }

  return best;
}

function buildMergeUpdate(
  existing: ExistingRestaurantRow,
  incoming: SeedPayload,
  hasOsmId: boolean
): Record<string, unknown> | null {
  const mergedDietary = mergeDietaryCategories(existing.dietary_categories, incoming.dietary_categories);
  const mergedStatus = mergeDietaryStatus(existing.dietary_claim_status, mergedDietary);
  const updates: Record<string, unknown> = {};

  if (JSON.stringify(existing.dietary_categories) !== JSON.stringify(mergedDietary)) {
    updates.dietary_categories = mergedDietary;
  }
  if (JSON.stringify(existing.dietary_claim_status ?? {}) !== JSON.stringify(mergedStatus)) {
    updates.dietary_claim_status = mergedStatus;
  }
  if (hasOsmId && incoming.osm_id && !existing.osm_id) {
    updates.osm_id = incoming.osm_id;
  }
  if (!existing.phone && incoming.phone) {
    updates.phone = incoming.phone;
  }
  if (!existing.website && incoming.website) {
    updates.website = incoming.website;
  }
  if (!existing.cuisine_type && incoming.cuisine_type) {
    updates.cuisine_type = incoming.cuisine_type;
  }
  if (!existing.area && incoming.area) {
    updates.area = incoming.area;
  }
  if ((!existing.address || existing.address === "Bengaluru") && incoming.address !== "Bengaluru") {
    updates.address = incoming.address;
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

function mergeDietaryCategories(existing: DietaryKey[] | null | undefined, incoming: DietaryKey[]): DietaryKey[] {
  const out = new Set<DietaryKey>();
  (existing ?? []).forEach((key) => out.add(key));
  incoming.forEach((key) => out.add(key));
  return DIETARY_ORDER.filter((key) => out.has(key));
}

function mergeDietaryStatus(
  existing: Partial<Record<DietaryKey, "unverified" | "verified">> | null | undefined,
  mergedDietary: DietaryKey[]
): Partial<Record<DietaryKey, "unverified" | "verified">> {
  const status = { ...(existing ?? {}) };
  for (const key of mergedDietary) {
    if (status[key] !== "verified" && status[key] !== "unverified") {
      status[key] = "unverified";
    }
  }
  return status;
}

function normalizePlaceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameSimilarity(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.93;
  const leftTokens = new Set(tokenizeName(left));
  const rightTokens = new Set(tokenizeName(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap++;
  }
  const union = leftTokens.size + rightTokens.size - overlap;
  return union > 0 ? overlap / union : 0;
}

function tokenizeName(name: string): string[] {
  const stopwords = new Set([
    "restaurant",
    "resto",
    "cafe",
    "cafeteria",
    "hotel",
    "kitchen",
    "bar",
    "grill",
    "foods",
    "food",
    "the",
    "and",
    "co",
    "llp",
    "pvt",
    "ltd",
  ]);

  return name
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !stopwords.has(token));
}

function latLngDelta(lat: number, meters: number): { lat: number; lng: number } {
  const latDelta = meters / 111_000;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const lngDelta = meters / (111_000 * Math.max(0.1, cosLat));
  return { lat: latDelta, lng: lngDelta };
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifyDietary(tags: Record<string, string>, name: string): DietaryKey[] {
  const out = new Set<DietaryKey>();

  const diet = (k: string) => (tags[`diet:${k}`] ?? "").toLowerCase();
  const isYes = (v: string) => v === "yes" || v === "only";

  if (isYes(diet("halal"))) out.add("halal");
  if (isYes(diet("jain"))) {
    out.add("jain");
    out.add("veg");
  }
  if (isYes(diet("vegan"))) {
    out.add("vegan");
    out.add("veg");
  }
  if (isYes(diet("vegetarian"))) out.add("veg");

  // diet:*=only means EXCLUSIVELY that category
  const vegOnly = diet("vegetarian") === "only" || diet("vegan") === "only" || diet("jain") === "only";
  // If it's only vegan/jain, veg is also implied (already added above)

  const cuisine = (tags.cuisine ?? "").toLowerCase();

  // Keyword fallback from name + cuisine
  if (out.size === 0) {
    const inferred = inferDietaryCategoriesFromMetadata(name, cuisine);
    inferred.forEach((k) => out.add(k));
  }

  // Additional cuisine hints
  if (/\bvegan\b/.test(cuisine)) {
    out.add("vegan");
    out.add("veg");
  }
  if (/\bvegetarian\b|\bindian_vegetarian\b|\bsouth_indian\b/.test(cuisine) && !vegOnly) {
    // south_indian is not strictly veg but heavily veg-leaning; only tag if no other signal
    if (out.size === 0) out.add("veg");
  }
  if (/\bhalal\b/.test(cuisine)) out.add("halal");

  // If still nothing, don't guess — leave empty (will not show on map)
  return DIETARY_ORDER.filter((k) => out.has(k));
}

function normalizeCuisine(raw: string | undefined): string | null {
  if (!raw) return null;
  return raw
    .split(";")
    .map((c) => c.trim().replace(/_/g, " "))
    .filter(Boolean)
    .map((c) => c.split(" ").map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join(" "))
    .slice(0, 3)
    .join(" · ") || null;
}

function numEnv(k: string, fallback: number): number {
  const raw = process.env[k];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function intEnv(k: string, fallback: number): number {
  return Math.max(1, Math.floor(numEnv(k, fallback)));
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
