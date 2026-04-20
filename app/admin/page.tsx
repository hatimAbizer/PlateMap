import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const supabase = await createServerSupabase();

  const [{ count: pendingClaims }, { count: flaggedReviews }, { count: totalRestaurants }, { count: verifiedRestaurants }] =
    await Promise.all([
      supabase.from("claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("reviews").select("*", { count: "exact", head: true }).eq("is_flagged", true),
      supabase.from("restaurants").select("*", { count: "exact", head: true }),
      supabase.from("restaurants").select("*", { count: "exact", head: true }).eq("is_verified", true),
    ]);

  const stats = [
    { label: "Pending claims", value: pendingClaims ?? 0, href: "/admin/claims" },
    { label: "Flagged reviews", value: flaggedReviews ?? 0, href: "/admin/reviews" },
    { label: "Restaurants", value: totalRestaurants ?? 0, href: "/admin/restaurants" },
    { label: "Verified", value: verifiedRestaurants ?? 0, href: "/admin/restaurants?verified=1" },
  ];

  return (
    <div>
      <div className="label-xs mb-2">Dashboard</div>
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Overview</h1>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group border border-border rounded-md p-5 hover:border-muted transition-colors"
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{s.label}</div>
            <div className="mt-2 font-display text-4xl font-semibold tracking-tight num">{s.value}</div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted group-hover:text-text transition-colors">
              View <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
