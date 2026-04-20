import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { createServerSupabase } from "@/lib/supabase/server";
import { ClaimForm } from "./ClaimForm";
import type { RestaurantRow, ClaimRow } from "@/types/database";

export const metadata = { title: "Claim listing" };

export default async function ClaimPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/claim/${params.id}`);

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<RestaurantRow>();

  if (!restaurant) notFound();

  const { data: existing } = await supabase
    .from("claims")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .eq("claimant_user_id", user.id)
    .maybeSingle<ClaimRow>();

  return (
    <main className="min-h-[100dvh] bg-bg text-text">
      <Navbar />
      <div className="mx-auto max-w-[880px] px-4 sm:px-6 py-10 md:py-14">
        <div className="label-xs mb-3">Claim a listing</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          {restaurant.name}
        </h1>
        <p className="text-sm text-muted mt-2 max-w-xl">
          Verify you represent this restaurant. An admin reviews every claim
          within 3 business days.
        </p>

        {restaurant.claimed_by ? (
          <div className="mt-8 border border-border rounded-md p-6">
            <div className="label-xs mb-2">Already claimed</div>
            <p className="text-sm text-muted">
              This listing has an active owner. If you believe this is in error,{" "}
              <a
                href="mailto:hello@platemap.app"
                className="text-text hover:underline"
              >
                contact the team
              </a>
              .
            </p>
          </div>
        ) : existing ? (
          <ClaimStatus status={existing.status} reason={existing.rejection_reason} />
        ) : (
          <div className="mt-8">
            <ClaimForm
              restaurantId={restaurant.id}
              userId={user.id}
              email={user.email ?? ""}
            />
          </div>
        )}

        <Link
          href={`/restaurant/${restaurant.slug}`}
          className="inline-block mt-8 text-[10px] uppercase tracking-[0.18em] text-muted hover:text-text"
        >
          ← Back to listing
        </Link>
      </div>
    </main>
  );
}

function ClaimStatus({
  status,
  reason,
}: {
  status: "pending" | "approved" | "rejected";
  reason: string | null;
}) {
  const copy =
    status === "pending"
      ? {
          title: "Under review",
          body: "Your claim is queued. You'll get an email when an admin approves or rejects it.",
          color: "text-amber-400",
        }
      : status === "approved"
        ? {
            title: "Approved",
            body: "You can now manage this listing from the owner portal.",
            color: "text-verified",
          }
        : {
            title: "Rejected",
            body: reason || "Your claim could not be verified.",
            color: "text-red-400",
          };
  return (
    <div className="mt-8 border border-border rounded-md p-6">
      <div className={`label-xs mb-2 ${copy.color}`}>{copy.title}</div>
      <p className="text-sm text-muted max-w-lg">{copy.body}</p>
      {status === "approved" && (
        <Link
          href="/owner"
          className="inline-flex items-center gap-2 h-9 px-4 mt-4 rounded-md bg-text text-bg text-xs uppercase tracking-[0.14em] font-semibold"
        >
          Open owner portal →
        </Link>
      )}
    </div>
  );
}
