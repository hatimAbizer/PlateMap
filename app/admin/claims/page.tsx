import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ClaimRow } from "@/types/database";

export const dynamic = "force-dynamic";
export const metadata = { title: "Claims" };

type Row = ClaimRow & {
  restaurants: { id: string; name: string; slug: string; area: string | null; city: string } | null;
};

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: { status?: "pending" | "approved" | "rejected" };
}) {
  const supabase = await createServerSupabase();
  const status = searchParams.status ?? "pending";

  const { data } = await supabase
    .from("claims")
    .select("*, restaurants:restaurant_id(id,name,slug,area,city)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  const claims = (data ?? []) as Row[];
  const tabs: Array<{ key: "pending" | "approved" | "rejected"; label: string }> = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div>
      <div className="label-xs mb-2">Claims</div>
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Review claims</h1>

      <div className="mt-6 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/claims?status=${t.key}`}
            className={`h-10 px-4 inline-flex items-center text-[11px] uppercase tracking-[0.14em] font-semibold border-b-2 -mb-px transition-colors ${
              status === t.key
                ? "text-text border-text"
                : "text-muted border-transparent hover:text-text"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {claims.length === 0 ? (
          <div className="border border-border rounded-md p-10 text-center">
            <div className="label-xs mb-2">Nothing {status}</div>
            <p className="text-sm text-muted">Claims will appear here as owners submit them.</p>
          </div>
        ) : (
          <ul className="border border-border rounded-md divide-y divide-border">
            {claims.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/claims/${c.id}`}
                  className="flex items-center justify-between gap-4 p-5 hover:bg-surface transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
                      {c.restaurants?.area ?? c.restaurants?.city ?? "—"}
                    </div>
                    <h3 className="font-display text-base font-semibold text-text truncate">
                      {c.restaurants?.name ?? "Unknown"}
                    </h3>
                    <div className="mt-1 text-xs text-muted">
                      {c.claimant_name} · {c.designation} · {c.business_email}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-muted">
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    <ArrowRight className="h-3 w-3 text-text" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
