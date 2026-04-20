"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { createClientSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function FavouriteButton({
  restaurantId,
  initial,
  userId,
  className,
}: {
  restaurantId: string;
  initial: boolean;
  userId: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    if (!userId) {
      router.push(`/login?next=/restaurant`);
      return;
    }
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const supabase = createClientSupabase();
      if (next) {
        const { error } = await supabase
          .from("favourites")
          .insert({ user_id: userId, restaurant_id: restaurantId, created_at: new Date().toISOString() });
        if (error) {
          setSaved(false);
          toast.error("Could not save");
        } else {
          toast.success("Added to favourites");
        }
      } else {
        const { error } = await supabase
          .from("favourites")
          .delete()
          .eq("user_id", userId)
          .eq("restaurant_id", restaurantId);
        if (error) {
          setSaved(true);
          toast.error("Could not remove");
        } else {
          toast("Removed from favourites");
        }
      }
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-surface text-xs uppercase tracking-[0.14em] font-semibold text-text hover:bg-surface-2 transition-colors disabled:opacity-60",
        className
      )}
    >
      <Heart
        className={cn("h-3.5 w-3.5 transition-all", saved && "fill-text")}
      />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
