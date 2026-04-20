import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { RestaurantRow } from "@/types/database";

export const metadata = { title: "Owner portal" };

export default async function OwnerPortalPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/owner");

  const { data: owned } = await supabase
    .from("restaurants")
    .select("*")
    .eq("claimed_by", user.id)
    .order("updated_at", { ascending: false });

  const list = (owned ?? []) as RestaurantRow[];

  return (
    <main className="min-h-[100dvh] bg-bg text-text">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-10 md:py-14">
        <div className="label-xs mb-2">Owner portal</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          Your listings
        </h1>
        <p className="text-sm text-muted mt-2">
          Update hours, photos, contact info, and dietary certification for
          restaurants you've verified.
        </p>

        <div className="mt-8">
          {list.length === 0 ? (
            <div className="border border-border rounded-md p-10 text-center">
              <div className="label-xs mb-2">Nothing here yet</div>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Submit a claim on any restaurant listing. Once approved by
                admin, it will appear here.
              </p>
            </div>
          ) : (
            <ul className="border border-border rounded-md divide-y divide-border">
              {list.map((r) => (
                <li key={r.id} className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-text">
                      {r.name}
                    </h3>
                    <div className="text-xs text-muted mt-0.5">
                      {r.area ?? r.city}
                    </div>
                  </div>
                  <Link
                    href={`/owner/${r.id}`}
                    className="text-xs uppercase tracking-[0.14em] text-text hover:text-muted"
                  >
                    Manage →
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
