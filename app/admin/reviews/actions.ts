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
  return supabase;
}

export async function dismissFlag(reviewId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("reviews")
    .update({ is_flagged: false, flag_reason: null })
    .eq("id", reviewId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function deleteReview(reviewId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/reviews");
  return { ok: true };
}
