import { createServerSupabase } from "@/lib/supabase/server";
import { MapShell } from "@/components/map/MapShell";
import { Navbar } from "@/components/layout/Navbar";
import type { RestaurantRow } from "@/types/database";

export const revalidate = 60;
const PAGE_SIZE = 1000;

export default async function HomePage() {
  const supabase = await createServerSupabase();
  const list = await fetchCategorizedRestaurants(supabase);

  return (
    <main className="relative bg-bg text-text">
      <Navbar variant="overlay" />
      <MapShell restaurants={list} />
    </main>
  );
}

async function fetchCategorizedRestaurants(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>
): Promise<RestaurantRow[]> {
  const out: RestaurantRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .not("dietary_categories", "eq", "{}")
      .order("review_count", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const rows = (data ?? []) as RestaurantRow[];
    if (rows.length === 0) break;
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  return out;
}
