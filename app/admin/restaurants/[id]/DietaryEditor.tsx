"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DIETARY, DIETARY_ORDER, getDietaryStatus, type DietaryKey, type DietaryVerificationStatus } from "@/lib/dietary";
import type { RestaurantRow } from "@/types/database";
import { cn } from "@/lib/utils";
import { updateDietary } from "./actions";

export function DietaryEditor({ restaurant }: { restaurant: RestaurantRow }) {
  const router = useRouter();
  const [categories, setCategories] = useState<DietaryKey[]>(restaurant.dietary_categories);
  const [statuses, setStatuses] = useState<Partial<Record<DietaryKey, DietaryVerificationStatus>>>(() =>
    Object.fromEntries(
      DIETARY_ORDER.map((k) => [k, getDietaryStatus(k, restaurant.dietary_claim_status, restaurant.is_verified)])
    ) as Partial<Record<DietaryKey, DietaryVerificationStatus>>
  );
  const [isVerified, setIsVerified] = useState(restaurant.is_verified);
  const [pending, start] = useTransition();

  const dirty = useMemo(() => {
    const a = [...categories].sort().join(",");
    const b = [...restaurant.dietary_categories].sort().join(",");
    if (a !== b) return true;
    if (isVerified !== restaurant.is_verified) return true;
    for (const k of categories) {
      const current = getDietaryStatus(k, restaurant.dietary_claim_status, restaurant.is_verified);
      if (statuses[k] !== current) return true;
    }
    return false;
  }, [categories, statuses, isVerified, restaurant]);

  const toggleCat = (k: DietaryKey) => {
    setCategories((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : DIETARY_ORDER.filter((x) => x === k || prev.includes(x))
    );
  };

  const save = () =>
    start(async () => {
      const r = await updateDietary(restaurant.id, categories, statuses, isVerified);
      if (!r.ok) return toast.error(r.error ?? "Failed");
      toast.success("Listing updated.");
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <div>
        <div className="label-xs mb-3">Categories</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {DIETARY_ORDER.map((k) => {
            const on = categories.includes(k);
            const st = statuses[k] ?? "unverified";
            return (
              <div
                key={k}
                className={cn(
                  "border rounded-md p-3 transition-colors",
                  on ? "border-text/40 bg-surface" : "border-border"
                )}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox checked={on} onCheckedChange={() => toggleCat(k)} />
                  <span
                    className="inline-flex h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: DIETARY[k].color }}
                  />
                  <span className="text-sm font-semibold">{DIETARY[k].label}</span>
                </label>
                {on && (
                  <div className="mt-3 flex gap-1">
                    {(["unverified", "verified"] as DietaryVerificationStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatuses((prev) => ({ ...prev, [k]: s }))}
                        className={cn(
                          "flex-1 text-[10px] uppercase tracking-[0.14em] font-semibold h-7 rounded-sm border transition-colors",
                          st === s
                            ? "bg-text text-bg border-text"
                            : "text-muted border-border hover:text-text"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border border-border rounded-md p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox checked={isVerified} onCheckedChange={(v) => setIsVerified(Boolean(v))} />
          <div>
            <div className="text-sm font-semibold">Listing verified</div>
            <div className="text-[11px] text-muted">
              Owner claim approved. Unverified claims default per category.
            </div>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-end pt-2 border-t border-border">
        <Button onClick={save} disabled={!dirty || pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
