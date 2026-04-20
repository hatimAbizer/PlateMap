import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Star } from "lucide-react";

import { createServerSupabase } from "@/lib/supabase/server";
import { DietaryBadge } from "@/components/restaurant/DietaryBadge";
import type { RestaurantRow } from "@/types/database";
import { formatRating } from "@/lib/utils";
import { getDietaryStatus } from "@/lib/dietary";

export const metadata = { title: "Favourites" };

export default async function FavouritesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/favourites");

  const { data: rows } = await supabase
    .from("favourites")
    .select("restaurant_id, created_at, restaurants(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = (rows ?? [])
    .map((row: any) => row.restaurants as RestaurantRow)
    .filter(Boolean);

  if (list.length === 0) {
    return (
      <div className="border border-border rounded-md p-10 text-center">
        <div className="label-xs mb-3">No favourites yet</div>
        <p className="text-sm text-muted max-w-sm mx-auto">
          Tap the save button on any listing to keep a list of places you want
          to visit — synced across devices.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-9 px-4 mt-6 rounded-md bg-text text-bg text-xs uppercase tracking-[0.14em] font-semibold"
        >
          Browse the map
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border border border-border rounded-md overflow-hidden">
      {list.map((r) => (
        <li key={r.id}>
          <Link
            href={`/restaurant/${r.slug}`}
            className="block p-4 hover:bg-surface-2 transition-colors group"
          >
            <div className="flex items-start gap-4">
              {r.photos[0] ? (
                <img
                  src={r.photos[0]}
                  alt=""
                  className="h-16 w-24 object-cover rounded-sm border border-border shrink-0"
                />
              ) : (
                <div className="h-16 w-24 bg-surface border border-border rounded-sm shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  {r.dietary_categories.map((c) => (
                    <DietaryBadge
                      key={c}
                      category={c}
                      size="sm"
                      status={getDietaryStatus(c, r.dietary_claim_status, r.is_verified)}
                    />
                  ))}
                </div>
                <h3 className="font-display text-base font-semibold text-text truncate">
                  {r.name}
                </h3>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1 text-text num">
                    <Star className="h-3 w-3 fill-text text-text" />
                    {formatRating(r.avg_rating)}
                  </span>
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3" />
                    {r.area ?? r.city}
                  </span>
                  {r.cuisine_type && (
                    <span className="truncate">{r.cuisine_type}</span>
                  )}
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted shrink-0 group-hover:text-text transition-colors">
                Open →
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
