import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { PreferencesForm } from "./PreferencesForm";
import type { ProfileRow } from "@/types/database";

export const metadata = { title: "Preferences" };

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const { count: favouritesCount } = await supabase
    .from("favourites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: reviewsCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
      <div>
        <PreferencesForm
          userId={user.id}
          email={user.email ?? ""}
          profile={profile}
        />
      </div>
      <aside className="space-y-4">
        <div className="border border-border rounded-md p-4">
          <div className="label-xs mb-3">At a glance</div>
          <div className="grid grid-cols-2 gap-3">
            <Stat value={favouritesCount ?? 0} label="Favourites" />
            <Stat value={reviewsCount ?? 0} label="Reviews" />
          </div>
        </div>
        <div className="border border-border rounded-md p-4">
          <div className="label-xs mb-2">Danger zone</div>
          <p className="text-xs text-muted leading-relaxed mb-3">
            Deleting your account removes your profile, favourites, and reviews.
            This cannot be undone.
          </p>
          <a
            href="mailto:hello@platemap.app?subject=Delete%20my%20account"
            className="text-[11px] uppercase tracking-[0.14em] text-red-400 hover:underline"
          >
            Request deletion →
          </a>
        </div>
      </aside>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border border-border rounded-md p-3">
      <div className="font-display text-2xl font-semibold num">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted mt-1">
        {label}
      </div>
    </div>
  );
}
