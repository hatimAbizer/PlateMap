"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  buildDietaryClaimStatus,
  type DietaryKey,
  type DietaryVerificationStatus,
} from "@/lib/dietary";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: admin } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/");
  return supabase;
}

export async function updateDietary(
  restaurantId: string,
  categories: DietaryKey[],
  statuses: Partial<Record<DietaryKey, DietaryVerificationStatus>>,
  isVerified: boolean
) {
  const supabase = await requireAdmin();

  const normalized = buildDietaryClaimStatus(categories, "unverified");
  for (const c of categories) {
    if (statuses[c] === "verified" || statuses[c] === "unverified") {
      normalized[c] = statuses[c];
    }
  }

  const { error } = await supabase
    .from("restaurants")
    .update({
      dietary_categories: categories,
      dietary_claim_status: normalized,
      is_verified: isVerified,
    })
    .eq("id", restaurantId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/restaurants");
  revalidatePath(`/admin/restaurants/${restaurantId}`);
  revalidatePath("/");
  return { ok: true };
}
