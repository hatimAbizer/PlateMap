import { createServerSupabase } from "@/lib/supabase/server";
import { MapShell } from "@/components/map/MapShell";
import { Navbar } from "@/components/layout/Navbar";
import type { RestaurantRow } from "@/types/database";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createServerSupabase();
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("*")
    .order("review_count", { ascending: false });

  const list: RestaurantRow[] = (restaurants ?? []) as RestaurantRow[];

  return (
    <main className="relative bg-bg text-text">
      <Navbar variant="overlay" />
      <MapShell restaurants={list} />
    </main>
  );
}
