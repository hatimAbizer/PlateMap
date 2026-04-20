"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClientSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIETARY, DIETARY_ORDER } from "@/lib/dietary";
import type { ProfileRow } from "@/types/database";
import { cn } from "@/lib/utils";

type Pref = "none" | "halal" | "veg" | "vegan" | "jain";

export function PreferencesForm({
  userId,
  email,
  profile,
}: {
  userId: string;
  email: string;
  profile: ProfileRow | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(profile?.name ?? "");
  const [pref, setPref] = useState<Pref>(profile?.dietary_preference ?? "none");
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const supabase = createClientSupabase();
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, name: name || null, dietary_preference: pref });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Saved");
      router.refresh();
    });
  };

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <section>
        <div className="label-xs mb-4">Account</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="mb-1.5 block uppercase tracking-[0.14em]">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block uppercase tracking-[0.14em]">Email</Label>
            <Input value={email} disabled />
          </div>
        </div>
      </section>

      <section>
        <div className="label-xs mb-4">Dietary preference</div>
        <div className="grid grid-cols-5 gap-2">
          <PrefCard
            active={pref === "none"}
            onClick={() => setPref("none")}
            label="None"
            hint="Show all"
          />
          {DIETARY_ORDER.map((k) => (
            <PrefCard
              key={k}
              active={pref === k}
              onClick={() => setPref(k)}
              label={DIETARY[k].label}
              color={DIETARY[k].color}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted mt-3 leading-relaxed max-w-md">
          Your preference highlights matching restaurants on the map and filters
          search results. You can change this any time.
        </p>
      </section>

      <div>
        <Button type="submit" disabled={pending} className="text-sm uppercase tracking-[0.14em]">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save preferences
        </Button>
      </div>
    </form>
  );
}

function PrefCard({
  active,
  onClick,
  label,
  hint,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "aspect-square flex flex-col items-start justify-between p-3 rounded-md border transition-all",
        active ? "border-text bg-surface" : "border-border text-muted hover:text-text"
      )}
      style={active && color ? { borderColor: color } : undefined}
    >
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: color ?? "hsl(var(--muted))" }}
      />
      <div className="text-left">
        <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-text">
          {label}
        </div>
        {hint && <div className="text-[9px] uppercase tracking-[0.14em] text-muted mt-0.5">{hint}</div>}
      </div>
    </button>
  );
}
