/**
 * Seed restaurants from TomTom POI search.
 * Run:  npm run seed
 *
 * Pulls restaurants around a list of Bengaluru anchor points, inserts them into
 * public.restaurants with inferred dietary_categories[] from metadata and marks
 * all inferred tags as unverified. Duplicates (by tomtom_id) are skipped.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { tomtomCategorySearch, type TomTomPoi } from "../lib/tomtom/client";
import { buildDietaryClaimStatus, inferDietaryCategoriesFromMetadata } from "../lib/dietary";
import { slugify } from "../lib/utils";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ANCHORS = [
  { name: "Indiranagar", lat: 12.9719, lng: 77.6412 },
  { name: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { name: "Frazer Town", lat: 12.9990, lng: 77.6160 },
  { name: "Malleswaram", lat: 13.0036, lng: 77.5712 },
  { name: "Jayanagar", lat: 12.9293, lng: 77.5830 },
  { name: "Basavanagudi", lat: 12.9432, lng: 77.5710 },
  { name: "Whitefield", lat: 12.9956, lng: 77.6962 },
  { name: "HSR Layout", lat: 12.9121, lng: 77.6446 },
  { name: "MG Road / CBD", lat: 12.9758, lng: 77.6063 },
];

// 7315 = Restaurant category in TomTom
const CATEGORY_RESTAURANT = "7315";

async function main() {
  const seen = new Set<string>();
  const all: TomTomPoi[] = [];

  for (const anchor of ANCHORS) {
    console.log(`Searching near ${anchor.name}…`);
    try {
      const pois = await tomtomCategorySearch({
        categorySet: CATEGORY_RESTAURANT,
        lat: anchor.lat,
        lng: anchor.lng,
        radius: 1800,
        limit: 50,
      });
      for (const p of pois) {
        if (seen.has(p.id) || !p.name) continue;
        seen.add(p.id);
        all.push(p);
      }
      await sleep(300);
    } catch (e) {
      console.error(`  failed near ${anchor.name}:`, e);
    }
  }

  console.log(`\nCollected ${all.length} unique POIs.`);

  let inserted = 0;
  let skipped = 0;

  for (const p of all) {
    const base = slugify(p.name) || "restaurant";
    const slug = `${base}-${p.id.slice(-6)}`.slice(0, 120);
    const dietary = inferDietaryCategoriesFromMetadata(
      p.name,
      p.address,
      p.categories.join(" "),
      p.website ?? ""
    );

    const { error } = await supabase.from("restaurants").insert({
      slug,
      name: p.name,
      address: p.address || "Bengaluru",
      city: "Bengaluru",
      area: p.area,
      lat: p.lat,
      lng: p.lng,
      phone: p.phone,
      website: p.website,
      cuisine_type: p.categories.filter((c) => c !== "restaurant")[0] ?? null,
      dietary_categories: dietary,
      dietary_claim_status: buildDietaryClaimStatus(dietary, "unverified"),
      is_verified: false,
      photos: [],
      tomtom_id: p.id,
    });

    if (error) {
      if (error.code === "23505") skipped++;
      else console.error(`  ${p.name} ↯`, error.message);
    } else {
      inserted++;
    }
  }

  console.log(`\nDone. Inserted ${inserted}, skipped (duplicates) ${skipped}.`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
