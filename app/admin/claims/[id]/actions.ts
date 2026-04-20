"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: admin } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/");
  return { supabase, userId: user.id };
}

export async function approveClaim(claimId: string) {
  const { supabase, userId } = await requireAdmin();

  const { data: claim, error: cErr } = await supabase
    .from("claims")
    .select("restaurant_id, claimant_user_id, status")
    .eq("id", claimId)
    .maybeSingle();
  if (cErr || !claim) return { ok: false, error: cErr?.message ?? "Claim not found" };
  if (claim.status !== "pending") return { ok: false, error: "Already reviewed" };

  const { error: rErr } = await supabase
    .from("restaurants")
    .update({ claimed_by: claim.claimant_user_id, is_verified: true })
    .eq("id", claim.restaurant_id);
  if (rErr) return { ok: false, error: rErr.message };

  const { error: uErr } = await supabase
    .from("claims")
    .update({ status: "approved", reviewed_by: userId, reviewed_at: new Date().toISOString() })
    .eq("id", claimId);
  if (uErr) return { ok: false, error: uErr.message };

  revalidatePath("/admin/claims");
  revalidatePath(`/admin/claims/${claimId}`);
  return { ok: true };
}

export async function rejectClaim(claimId: string, reason: string) {
  const { supabase, userId } = await requireAdmin();

  const { error } = await supabase
    .from("claims")
    .update({
      status: "rejected",
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || null,
    })
    .eq("id", claimId)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/claims");
  revalidatePath(`/admin/claims/${claimId}`);
  return { ok: true };
}

export async function signProofUrl(path: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.storage.from("claim-docs").createSignedUrl(path, 60 * 5);
  if (error || !data) return { ok: false as const, error: error?.message ?? "Signing failed" };
  return { ok: true as const, url: data.signedUrl };
}
