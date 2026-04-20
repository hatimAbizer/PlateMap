import Link from "next/link";
import { Search as SearchIcon, Star } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createServerSupabase } from "@/lib/supabase/server";
import { DietaryBadge } from "@/components/restaurant/DietaryBadge";
import type { RestaurantRow, DietaryCategory } from "@/types/database";
import { formatRating } from "@/lib/utils";
import { getDietaryStatus } from "@/lib/dietary";

export const metadata = { title: "Search" };

const CAT_LABEL: Record<DietaryCategory, string> = {
  halal: "Halal",
  veg: "Vegetarian",
  vegan: "Vegan",
  jain: "Jain",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; cat?: DietaryCategory };
}) {
  const q = (searchParams.q ?? "").trim();
  const cat = searchParams.cat;

  const supabase = await createServerSupabase();
  let query = supabase.from("restaurants").select("*");
  if (cat) query = query.contains("dietary_categories", [cat]);
  if (q) query = query.ilike("name", `%${q}%`);
  const { data } = await query.order("avg_rating", { ascending: false, nullsFirst: false }).limit(60);
  const list = (data ?? []) as RestaurantRow[];

  return (
    <main className="min-h-[100dvh] bg-bg text-text">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-10 md:py-14">
        <div className="label-xs mb-2">Search</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          {cat ? `${CAT_LABEL[cat]} in Bengaluru` : q ? `Results for "${q}"` : "Find a restaurant"}
        </h1>

        <form className="mt-6 flex items-center gap-2 max-w-xl" action="/search">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-md border border-border bg-surface">
            <SearchIcon className="h-4 w-4 text-muted" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, area, cuisine"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-4 rounded-md bg-text text-bg text-xs uppercase tracking-[0.14em] font-semibold hover:bg-text/90"
          >
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["halal", "veg", "vegan", "jain"] as DietaryCategory[]).map((c) => (
            <Link
              key={c}
              href={`/search?cat=${c}`}
              className={`text-[10px] uppercase tracking-[0.14em] font-semibold px-3 h-8 inline-flex items-center rounded-md border transition-colors ${
                cat === c
                  ? "bg-text text-bg border-text"
                  : "text-muted border-border hover:text-text"
              }`}
            >
              {CAT_LABEL[c]}
            </Link>
          ))}
          {(cat || q) && (
            <Link
              href="/search"
              className="text-[10px] uppercase tracking-[0.14em] font-semibold px-3 h-8 inline-flex items-center rounded-md border border-border text-muted hover:text-text"
            >
              Clear
            </Link>
          )}
        </div>

        <div className="mt-8">
          {list.length === 0 ? (
            <div className="border border-border rounded-md p-10 text-center">
              <div className="label-xs mb-2">Nothing found</div>
              <p className="text-sm text-muted">Try a different keyword or category.</p>
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-4">
              {list.map((r, idx) => (
                <li key={r.id}>
                  {idx === 5 && <AdSlot />}
                  <Link
                    href={`/restaurant/${r.slug}`}
                    className="block border border-border rounded-md overflow-hidden hover:border-muted transition-colors group"
                  >
                    {r.photos[0] ? (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={r.photos[0]}
                          alt=""
                          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-surface" />
                    )}
                    <div className="p-4">
                        <div className="flex flex-wrap gap-1.5 mb-2">
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
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-muted">
                        <span className="inline-flex items-center gap-1 text-text num">
                          <Star className="h-3 w-3 fill-text text-text" />
                          {formatRating(r.avg_rating)}
                        </span>
                        <span className="num">{r.review_count} rev.</span>
                        <span className="truncate">{r.area ?? r.city}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

function AdSlot() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!client) return null;
  return (
    <div className="sm:col-span-2 border border-border rounded-md p-4 text-center mb-4">
      <div className="label-xs mb-2">Sponsored</div>
      <ins
        className="adsbygoogle block"
        style={{ display: "block", minHeight: 90 }}
        data-ad-client={client}
        data-ad-slot="auto"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
