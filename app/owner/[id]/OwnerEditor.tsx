"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClientSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RestaurantRow } from "@/types/database";

export function OwnerEditor({ restaurant }: { restaurant: RestaurantRow }) {
  const router = useRouter();
  const [phone, setPhone] = useState(restaurant.phone ?? "");
  const [website, setWebsite] = useState(restaurant.website ?? "");
  const [description, setDescription] = useState(restaurant.description ?? "");
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const supabase = createClientSupabase();
      const { error } = await supabase
        .from("restaurants")
        .update({
          phone: phone || null,
          website: website || null,
          description: description || null,
        })
        .eq("id", restaurant.id);
      if (error) return toast.error(error.message);
      toast.success("Saved. Changes go live and are flagged for admin review.");
      router.refresh();
    });
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div>
        <Label className="mb-1.5 block uppercase tracking-[0.14em]">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px]"
          placeholder="Tell diners what's worth ordering."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block uppercase tracking-[0.14em]">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block uppercase tracking-[0.14em]">Website</Label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
          Dietary categories can only be updated by PlateMap admins.
        </p>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
