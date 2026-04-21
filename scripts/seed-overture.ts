import { config } from "dotenv";
import duckdb from "@duckdb/node-api";
import { createClient } from "@supabase/supabase-js";
import {
  buildDietaryClaimStatus,
  inferDietaryCategoriesFromMetadata,
  type DietaryKey,
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
  minLat: readNumberEnv("OVERTURE_MIN_LAT", 12.85),
  maxLat: readNumberEnv("OVERTURE_MAX_LAT", 13.08),
  minLng: readNumberEnv("OVERTURE_MIN_LNG", 77.45),
  maxLng: readNumberEnv("OVERTURE_MAX_LNG", 77.75),
};

const LIMIT = readNumberEnv("OVERTURE_LIMIT", 5000);
const MIN_CONFIDENCE = readNumberEnv("OVERTURE_MIN_CONFIDENCE", 0.0);
const DRY_RUN = /^(1|true)$/i.test(process.env.OVERTURE_DRY_RUN ?? "");
const REQUIRE_DIETARY = /^(1|true)$/i.test(process.env.OVERTURE_REQUIRE_DIETARY ?? "0");

type OvertureRow = {
  id: string;
  name: string;
  category: string;
  basic_category: string;
  taxonomy_primary: string;
  alternates: string;
  address: string;
  locality: string;
  website: string;
  phone: string;
  lat: number | string;
  lng: number | string;
  confidence: number | string | null;
};

async function main() {
  const release = await resolveOvertureRelease();
  const releasePath = `s3://overturemaps-us-west-2/release/${release}/theme=places/type=place/*`;
  console.log(`Using Overture release ${release}`);

  const conn = await duckdb.DuckDBConnection.create();
  await conn.run(
    [
      "INSTALL httpfs",
      "INSTALL spatial",
      "LOAD httpfs",
      "LOAD spatial",
      "SET s3_region='us-west-2'",
      "SET http_timeout=120000",
      "SET http_retries=5",
      "SET http_retry_wait_ms=1000",
      "SET http_keep_alive=true",
    ].join("; ") + ";"
  );

  const sql = `
    SELECT
      id,
      names.primary AS name,
      coalesce(categories.primary, '') AS category,
      coalesce(basic_category, '') AS basic_category,
      coalesce(taxonomy.primary, '') AS taxonomy_primary,
      coalesce(array_to_string(categories.alternate, ' '), '') AS alternates,
      coalesce(addresses[1].freeform, '') AS address,
      coalesce(addresses[1].locality, '') AS locality,
      coalesce(websites[1], '') AS website,
      coalesce(phones[1], '') AS phone,
      ST_Y(geometry) AS lat,
      ST_X(geometry) AS lng,
      confidence
    FROM read_parquet('${releasePath}', filename=true, hive_partitioning=1)
    WHERE bbox.xmin BETWEEN ${BBOX.minLng} AND ${BBOX.maxLng}
      AND bbox.ymin BETWEEN ${BBOX.minLat} AND ${BBOX.maxLat}
      AND names.primary IS NOT NULL
      AND (
        lower(coalesce(categories.primary, '')) LIKE '%restaurant%'
        OR lower(coalesce(basic_category, '')) LIKE '%restaurant%'
        OR lower(coalesce(taxonomy.primary, '')) LIKE '%restaurant%'
      )
      AND (confidence IS NULL OR confidence >= ${MIN_CONFIDENCE})
    ORDER BY confidence DESC NULLS LAST
    LIMIT ${Math.max(1, Math.floor(LIMIT))}
  `;

  const reader = await conn.runAndReadAll(sql);
  const rows = reader.getRowObjectsJson() as OvertureRow[];
  conn.closeSync();

  console.log(`Fetched ${rows.length} Overture places in bbox.`);

  const payloads: Array<{
    overtureId: string;
    payload: {
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
      dietary_claim_status: ReturnType<typeof buildDietaryClaimStatus>;
      is_verified: boolean;
      photos: string[];
      overture_id: string;
    };
  }> = [];
  let skippedInvalid = 0;
  let skippedNoDietary = 0;
  let wouldUpsert = 0;

  for (const row of rows) {
    const name = safeText(row.name);
    const overtureId = safeText(row.id);
    const lat = toFiniteNumber(row.lat);
    const lng = toFiniteNumber(row.lng);

    if (!name || !overtureId || lat == null || lng == null) {
      skippedInvalid++;
      continue;
    }

    const category = safeText(row.category);
    const basicCategory = safeText(row.basic_category);
    const taxonomyPrimary = safeText(row.taxonomy_primary);
    const alternates = safeText(row.alternates);
    const address = safeText(row.address);
    const website = safeText(row.website);
    const phone = safeText(row.phone);

    const dietary = classifyDietaryFromMetadata(
      name,
      category,
      basicCategory,
      taxonomyPrimary,
      alternates,
      address,
      website
    );
    if (REQUIRE_DIETARY && dietary.length === 0) {
      skippedNoDietary++;
      continue;
    }

    const slugBase = slugify(name) || "restaurant";
    const slug = `${slugBase}-${overtureId.slice(-6)}`.slice(0, 120);
    const city = "Bengaluru";
    const area = deriveArea(address, row.locality);
    const cuisine = normalizeCuisine(category || taxonomyPrimary || basicCategory);

    const payload = {
      slug,
      name,
      address: address || city,
      city,
      area,
      lat,
      lng,
      phone: phone || null,
      website: website || null,
      cuisine_type: cuisine,
      dietary_categories: dietary,
      dietary_claim_status: buildDietaryClaimStatus(dietary, "unverified"),
      is_verified: false,
      photos: [],
      overture_id: overtureId,
    };

    payloads.push({ overtureId, payload });
    wouldUpsert++;
  }

  if (DRY_RUN) {
    console.log(
      `Dry run complete. Would upsert ${wouldUpsert}, invalid ${skippedInvalid}, no-dietary ${skippedNoDietary}.`
    );
    return;
  }

  const existingByOvertureId = await fetchExistingByOvertureId(payloads.map((item) => item.overtureId));
  const upserts: Array<(typeof payloads)[number]["payload"]> = [];
  let plannedInsert = 0;
  let plannedUpdate = 0;
  let protectedRows = 0;

  for (const item of payloads) {
    const existing = existingByOvertureId.get(item.overtureId);
    if (existing) {
      if (existing.is_verified || existing.claimed_by) {
        protectedRows++;
        continue;
      }
      plannedUpdate++;
    } else {
      plannedInsert++;
    }
    upserts.push(item.payload);
  }

  let written = 0;
  let errors = 0;
  const BATCH = 500;
  let onConflict = "overture_id";
  for (let i = 0; i < upserts.length; i += BATCH) {
    const batch = upserts.slice(i, i + BATCH);
    let { error } = await supabase.from("restaurants").upsert(batch, { onConflict });
    if (
      error &&
      onConflict === "overture_id" &&
      /no unique or exclusion constraint matching the ON CONFLICT specification/i.test(error.message)
    ) {
      console.warn(
        "restaurants.overture_id has no unique constraint; apply supabase/migrations/0006_fix_source_id_uniques.sql. Falling back to slug conflict handling."
      );
      onConflict = "slug";
      const retry = await supabase.from("restaurants").upsert(batch, { onConflict });
      error = retry.error;
    }
    if (error) {
      errors++;
      console.error(`Batch ${i}-${i + batch.length} ↯ ${error.message}`);
      continue;
    }
    written += batch.length;
    console.log(`... ${written}/${upserts.length}`);
  }

  console.log(
    `Done. Upserted ${written}, planned inserts ${plannedInsert}, planned updates ${plannedUpdate}, protected ${protectedRows}, errors ${errors}, invalid ${skippedInvalid}, no-dietary ${skippedNoDietary}.`
  );
}

function classifyDietaryFromMetadata(...parts: Array<string | null | undefined>): DietaryKey[] {
  const inferred = inferDietaryCategoriesFromMetadata(...parts);
  if (inferred.length > 0) return inferred;

  const text = parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\bvegan\b|\bplant[-\s]?based\b/.test(text)) return ["vegan", "veg"];
  if (/\bjain\b|\bno onion\b|\bno garlic\b/.test(text)) return ["jain", "veg"];
  if (/\bhalal\b|\bzabiha\b/.test(text)) return ["halal"];

  if (/\bbiryani\b|\bkebab\b|\bshawarma\b|\bmutton\b|\bchicken\b|\bmeat\b|\bseafood\b|\bfish\b/.test(text)) {
    return ["halal"];
  }

  if (/\bvegetarian\b|\bpure veg\b|\bveg\b|\budupi\b|\bdosa\b|\btiffin\b|\bsweets?\b/.test(text)) {
    return ["veg"];
  }

  return [];
}

function deriveArea(address: string, locality: string): string | null {
  const loc = safeText(locality);
  if (loc && !/bengaluru|bangalore/i.test(loc)) return loc;

  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !/bengaluru|bangalore|karnataka|india/i.test(p))
    .filter((p) => !/\b\d{6}\b/.test(p));

  if (parts.length === 0) return null;
  return parts[parts.length - 1];
}

function normalizeCuisine(raw: string): string | null {
  const cleaned = raw
    .replace(/_/g, " ")
    .replace(/\brestaurant\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return cleaned
    .split(" ")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p))
    .join(" ");
}

function safeText(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function toFiniteNumber(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function readNumberEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function resolveOvertureRelease(): Promise<string> {
  const fromEnv = safeText(process.env.OVERTURE_RELEASE);
  if (fromEnv) return fromEnv;

  try {
    const res = await fetch("https://stac.overturemaps.org/catalog.json");
    if (!res.ok) throw new Error(`STAC ${res.status}`);
    const json = (await res.json()) as { latest?: string };
    if (typeof json.latest === "string" && json.latest.trim()) return json.latest;
  } catch {
    // fall through
  }

  return "2026-04-15.0";
}

async function fetchExistingByOvertureId(
  overtureIds: string[]
): Promise<Map<string, { id: string; is_verified: boolean; claimed_by: string | null }>> {
  const map = new Map<string, { id: string; is_verified: boolean; claimed_by: string | null }>();
  const BATCH = 500;
  for (let i = 0; i < overtureIds.length; i += BATCH) {
    const chunk = overtureIds.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from("restaurants")
      .select("id,overture_id,is_verified,claimed_by")
      .in("overture_id", chunk);
    if (error || !data) continue;
    for (const row of data as Array<{ id: string; overture_id: string; is_verified: boolean; claimed_by: string | null }>) {
      if (row.overture_id) {
        map.set(row.overture_id, {
          id: row.id,
          is_verified: row.is_verified,
          claimed_by: row.claimed_by,
        });
      }
    }
  }
  return map;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
