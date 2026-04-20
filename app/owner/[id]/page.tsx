import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { OwnerEditor } from "./OwnerEditor";
import type { RestaurantRow } from "@/types/database";

export const metadata = { title: "Edit listing" };

export default async function OwnerEditPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/owner/${params.id}`);

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<RestaurantRow>();

  if (!restaurant) notFound();
  if (restaurant.claimed_by !== user.id) redirect("/owner");

  return (
    <main className="min-h-[100dvh] bg-bg text-text">
      <Navbar />
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 py-10 md:py-14">
        <Link
          href="/owner"
          className="text-[10px] uppercase tracking-[0.18em] text-muted hover:text-text"
        >
          ← All listings
        </Link>
        <div className="label-xs mt-4 mb-2">Edit listing</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          {restaurant.name}
        </h1>

        <div className="mt-8">
          <OwnerEditor restaurant={restaurant} />
        </div>
      </div>
    </main>
  );
}
