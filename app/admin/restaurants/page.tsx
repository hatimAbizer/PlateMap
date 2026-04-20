import Link from "next/link";
import { ArrowRight, Search as SearchIcon } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { DietaryBadge } from "@/components/restaurant/DietaryBadge";
import type { RestaurantRow } from "@/types/database";
import { getDietaryStatus } from "@/lib/dietary";

export const dynamic = "force-dynamic";
export const metadata = { title: "Restaurants" };

export default async function AdminRestaurantsPage({
  searchParams,
}: {
  searchParams: { q?: string; verified?: string };
}) {
  const supabase = await createServerSupabase();
  const q = (searchParams.q ?? "").trim();
  const verifiedOnly = searchParams.verified === "1";

  let query = supabase
    .from("restaurants")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(80);
  if (q) query = query.ilike("name", `%${q}%`);
  if (verifiedOnly) query = query.eq("is_verified", true);

  const { data } = await query;
  const list = (data ?? []) as RestaurantRow[];

  return (
    <div>
      <div className="label-xs mb-2">Restaurants</div>
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
        All listings
      </h1>

      <form action="/admin/restaurants" className="mt-6 flex items-center gap-2 max-w-xl">
        {verifiedOnly && <input type="hidden" name="verified" value="1" />}
        <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-md border border-border bg-surface">
          <SearchIcon className="h-4 w-4 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <button
          type="submit"
          className="h-11 px-4 rounded-md bg-text text-bg text-xs uppercase tracking-[0.14em] font-semibold"
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex gap-2">
        <Link
          href="/admin/restaurants"
          className={`text-[10px] uppercase tracking-[0.14em] font-semibold px-3 h-8 inline-flex items-center rounded-md border ${
            !verifiedOnly ? "bg-text text-bg border-text" : "text-muted border-border hover:text-text"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/restaurants?verified=1"
          className={`text-[10px] uppercase tracking-[0.14em] font-semibold px-3 h-8 inline-flex items-center rounded-md border ${
            verifiedOnly ? "bg-text text-bg border-text" : "text-muted border-border hover:text-text"
          }`}
        >
          Verified
        </Link>
      </div>

      <div className="mt-6">
        {list.length === 0 ? (
          <div className="border border-border rounded-md p-10 text-center text-sm text-muted">
            No listings match.
          </div>
        ) : (
          <ul className="border border-border rounded-md divide-y divide-border">
            {list.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/restaurants/${r.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-surface transition-colors"
                >
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold text-text truncate">
                      {r.name}
                    </h3>
                    <div className="mt-0.5 text-xs text-muted truncate">
                      {r.area ?? r.city}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-w-[50%] justify-end">
                    {r.dietary_categories.map((c) => (
                      <DietaryBadge
                        key={c}
                        category={c}
                        size="sm"
                        status={getDietaryStatus(c, r.dietary_claim_status, r.is_verified)}
                      />
                    ))}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
