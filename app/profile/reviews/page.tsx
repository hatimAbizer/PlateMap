import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";

import { createServerSupabase } from "@/lib/supabase/server";
import type { RestaurantRow, ReviewRow } from "@/types/database";
import { cn } from "@/lib/utils";

export const metadata = { title: "My reviews" };

export default async function MyReviewsPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/reviews");

  const { data: rows } = await supabase
    .from("reviews")
    .select("*, restaurants(slug, name, area, city, dietary_categories)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = (rows ?? []) as (ReviewRow & {
    restaurants: Pick<RestaurantRow, "slug" | "name" | "area" | "city" | "dietary_categories">;
  })[];

  if (list.length === 0) {
    return (
      <div className="border border-border rounded-md p-10 text-center">
        <div className="label-xs mb-3">No reviews yet</div>
        <p className="text-sm text-muted max-w-sm mx-auto">
          Leave a review on any restaurant listing and it will appear here.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-9 px-4 mt-6 rounded-md bg-text text-bg text-xs uppercase tracking-[0.14em] font-semibold"
        >
          Find a restaurant
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border border border-border rounded-md overflow-hidden">
      {list.map((rv) => (
        <li key={rv.id} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Link
                href={`/restaurant/${rv.restaurants.slug}`}
                className="font-display text-base font-semibold text-text hover:underline"
              >
                {rv.restaurants.name}
              </Link>
              <div className="mt-0.5 text-[11px] text-muted">
                {rv.restaurants.area ?? rv.restaurants.city}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      "h-3 w-3",
                      n <= rv.rating ? "fill-text text-text" : "fill-none text-muted"
                    )}
                    strokeWidth={1.5}
                  />
                ))}
                <span className="text-[10px] text-muted num">{rv.rating}.0</span>
              </div>
              <p className="mt-3 text-sm text-text leading-relaxed">
                {rv.text}
              </p>
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted num shrink-0">
              {new Date(rv.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
