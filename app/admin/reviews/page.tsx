import Link from "next/link";
import { Star } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { ReviewActions } from "./ReviewActions";
import type { ReviewRow } from "@/types/database";

export const dynamic = "force-dynamic";
export const metadata = { title: "Flagged reviews" };

type Row = ReviewRow & {
  restaurants: { id: string; name: string; slug: string } | null;
  profiles: { id: string; name: string | null } | null;
};

export default async function AdminReviewsPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("reviews")
    .select("*, restaurants:restaurant_id(id,name,slug), profiles:user_id(id,name)")
    .eq("is_flagged", true)
    .order("created_at", { ascending: false });

  const list = (data ?? []) as Row[];

  return (
    <div>
      <div className="label-xs mb-2">Moderation</div>
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
        Flagged reviews
      </h1>

      <div className="mt-6">
        {list.length === 0 ? (
          <div className="border border-border rounded-md p-10 text-center text-sm text-muted">
            Nothing flagged. Good.
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((r) => (
              <li key={r.id} className="border border-border rounded-md p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <Link
                      href={`/restaurant/${r.restaurants?.slug ?? ""}`}
                      className="font-display text-base font-semibold text-text hover:underline"
                    >
                      {r.restaurants?.name ?? "Unknown"}
                    </Link>
                    <div className="mt-0.5 text-[11px] text-muted flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-text num">
                        <Star className="h-3 w-3 fill-text text-text" />
                        {r.rating}
                      </span>
                      · {r.profiles?.name ?? "Anonymous"}
                      · {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ReviewActions reviewId={r.id} />
                </div>
                <p className="mt-3 text-sm text-text leading-relaxed">{r.text}</p>
                {r.flag_reason && (
                  <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-red-400/80">
                    Reason · {r.flag_reason}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
