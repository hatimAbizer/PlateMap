import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ClaimReview } from "./ClaimReview";
import type { ClaimRow, RestaurantRow } from "@/types/database";

export const dynamic = "force-dynamic";
export const metadata = { title: "Claim" };

type Row = ClaimRow & { restaurants: RestaurantRow | null };

export default async function ClaimDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("claims")
    .select("*, restaurants:restaurant_id(*)")
    .eq("id", params.id)
    .maybeSingle<Row>();

  if (!data) notFound();

  const r = data.restaurants;

  return (
    <div>
      <Link
        href="/admin/claims"
        className="text-[10px] uppercase tracking-[0.18em] text-muted hover:text-text"
      >
        ← All claims
      </Link>

      <div className="mt-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="label-xs mb-2">Claim detail</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            {r?.name ?? "Unknown restaurant"}
          </h1>
          {r && (
            <p className="text-sm text-muted mt-2">
              {r.area ?? r.city} · <Link href={`/restaurant/${r.slug}`} className="underline-offset-4 hover:underline">view listing</Link>
            </p>
          )}
        </div>
        <span
          className={`text-[10px] uppercase tracking-[0.18em] font-semibold px-2.5 h-7 inline-flex items-center rounded-sm border ${
            data.status === "approved"
              ? "text-verified border-verified/40"
              : data.status === "rejected"
                ? "text-red-400 border-red-400/40"
                : "text-amber-300 border-amber-300/40"
          }`}
        >
          {data.status}
        </span>
      </div>

      <div className="mt-8 grid lg:grid-cols-[1fr_minmax(320px,380px)] gap-6">
        <div className="border border-border rounded-md divide-y divide-border">
          <Row label="Claimant" value={data.claimant_name} />
          <Row label="Designation" value={data.designation} />
          <Row label="Business email" value={<a className="text-text hover:underline" href={`mailto:${data.business_email}`}>{data.business_email}</a>} />
          <Row label="Phone" value={<a className="text-text hover:underline" href={`tel:${data.phone}`}>{data.phone}</a>} />
          <Row label="Submitted" value={new Date(data.created_at).toLocaleString()} />
          {data.reviewed_at && <Row label="Reviewed" value={new Date(data.reviewed_at).toLocaleString()} />}
          {data.rejection_reason && <Row label="Rejection reason" value={data.rejection_reason} />}
        </div>

        <ClaimReview
          claimId={data.id}
          status={data.status}
          proofPath={data.proof_doc_url}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 px-5 py-4">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted shrink-0">{label}</span>
      <span className="text-sm text-text text-right break-words">{value}</span>
    </div>
  );
}
