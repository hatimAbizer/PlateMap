import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { DietaryEditor } from "./DietaryEditor";
import type { RestaurantRow } from "@/types/database";

export const dynamic = "force-dynamic";
export const metadata = { title: "Restaurant" };

export default async function AdminRestaurantDetail({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabase();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<RestaurantRow>();

  if (!restaurant) notFound();

  return (
    <div>
      <Link
        href="/admin/restaurants"
        className="text-[10px] uppercase tracking-[0.18em] text-muted hover:text-text"
      >
        ← All listings
      </Link>

      <div className="mt-4">
        <div className="label-xs mb-2">Listing</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          {restaurant.name}
        </h1>
        <p className="text-sm text-muted mt-2">
          {restaurant.area ?? restaurant.city}
          <Link
            href={`/restaurant/${restaurant.slug}`}
            className="inline-flex items-center gap-1 ml-3 underline-offset-4 hover:underline"
          >
            View public <ExternalLink className="h-3 w-3" />
          </Link>
        </p>
      </div>

      <div className="mt-8 grid lg:grid-cols-[1fr_minmax(320px,420px)] gap-6">
        <div className="border border-border rounded-md divide-y divide-border">
          <Row label="Address" value={restaurant.address} />
          <Row label="Cuisine" value={restaurant.cuisine_type ?? "—"} />
          <Row label="Phone" value={restaurant.phone ?? "—"} />
          <Row label="Website" value={restaurant.website ?? "—"} />
          <Row label="Overture ID" value={restaurant.overture_id ?? "—"} />
          <Row label="Rating" value={`${restaurant.avg_rating ?? "—"} · ${restaurant.review_count} reviews`} />
          <Row label="Owner" value={restaurant.claimed_by ?? "Unclaimed"} />
        </div>

        <DietaryEditor restaurant={restaurant} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 px-5 py-4">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted shrink-0">{label}</span>
      <span className="text-sm text-text text-right break-words">{value}</span>
    </div>
  );
}
