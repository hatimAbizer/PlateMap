export const DIETARY = {
  halal: { label: "Halal", color: "#795548", textOnColor: "#ffffff" },
  veg: { label: "Vegetarian", color: "#388E3C", textOnColor: "#ffffff" },
  vegan: { label: "Vegan", color: "#7B1FA2", textOnColor: "#ffffff" },
  jain: { label: "Jain", color: "#9E9E9E", textOnColor: "#000000" },
} as const;

export type DietaryKey = keyof typeof DIETARY;
export type DietaryVerificationStatus = "unverified" | "verified";
export type DietaryClaimStatusMap = Partial<Record<DietaryKey, DietaryVerificationStatus>>;
export const DIETARY_KEYS = Object.keys(DIETARY) as DietaryKey[];

export const DIETARY_ORDER: DietaryKey[] = ["halal", "veg", "vegan", "jain"];

export function primaryDietary(cats: DietaryKey[] | undefined): DietaryKey | null {
  if (!cats || cats.length === 0) return null;
  for (const key of DIETARY_ORDER) if (cats.includes(key)) return key;
  return cats[0];
}

export function dietaryBadgeLabel(
  key: DietaryKey,
  status: DietaryVerificationStatus = "unverified"
): string {
  const base = DIETARY[key].label;
  return `${base} ${status === "verified" ? "Verified" : "Unverified"}`;
}

export function getDietaryStatus(
  key: DietaryKey,
  claims?: DietaryClaimStatusMap | null,
  fallbackVerified = false
): DietaryVerificationStatus {
  const status = claims?.[key];
  if (status === "verified" || status === "unverified") return status;
  return fallbackVerified ? "verified" : "unverified";
}

export function buildDietaryClaimStatus(
  categories: DietaryKey[],
  status: DietaryVerificationStatus
): DietaryClaimStatusMap {
  return Object.fromEntries(categories.map((c) => [c, status])) as DietaryClaimStatusMap;
}

export function inferDietaryCategoriesFromMetadata(...parts: Array<string | null | undefined>): DietaryKey[] {
  const text = parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!text) return [];

  const out = new Set<DietaryKey>();
  const hasNonVeg = /\bnon[-\s]?veg\b/.test(text);
  const hasVegan = /\bvegan\b|\bplant[-\s]?based\b/.test(text);
  const hasJain = /\bjain\b|\bno onion\b|\bno garlic\b/.test(text);
  const hasHalal = /\bhalal\b|\bzabiha\b/.test(text);
  const hasVeg = /\bpure veg\b|\bvegetarian\b|\bveg(?:\b|[.-])/.test(text) && !hasNonVeg;

  if (hasHalal) out.add("halal");
  if (hasVegan) {
    out.add("vegan");
    out.add("veg");
  }
  if (hasJain) {
    out.add("jain");
    out.add("veg");
  }
  if (hasVeg) out.add("veg");

  return DIETARY_ORDER.filter((k) => out.has(k));
}
