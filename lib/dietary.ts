export const DIETARY = {
  halal: { label: "Halal", color: "#795548", textOnColor: "#ffffff" },
  veg: { label: "Vegetarian", color: "#388E3C", textOnColor: "#ffffff" },
  vegan: { label: "Vegan", color: "#7B1FA2", textOnColor: "#ffffff" },
  jain: { label: "Jain", color: "#9E9E9E", textOnColor: "#000000" },
} as const;

export type DietaryKey = keyof typeof DIETARY;
export const DIETARY_KEYS = Object.keys(DIETARY) as DietaryKey[];

export const DIETARY_ORDER: DietaryKey[] = ["halal", "veg", "vegan", "jain"];

export function primaryDietary(cats: DietaryKey[] | undefined): DietaryKey | null {
  if (!cats || cats.length === 0) return null;
  for (const key of DIETARY_ORDER) if (cats.includes(key)) return key;
  return cats[0];
}

export function dietaryBadgeLabel(key: DietaryKey, verified?: boolean): string {
  switch (key) {
    case "halal":
      return verified ? "Halal Certified" : "Halal";
    case "veg":
      return "Pure Veg";
    case "vegan":
      return "Vegan";
    case "jain":
      return "Jain Friendly";
  }
}
