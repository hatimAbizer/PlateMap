"use client";

import { useState } from "react";
import { Flag, Star } from "lucide-react";
import { toast } from "sonner";
import { createClientSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface ReviewWithAuthor {
  id: string;
  rating: number;
  text: string;
  photos: string[];
  created_at: string;
  user_id: string;
  author_name: string | null;
  is_flagged: boolean;
}

export function ReviewCard({
  review,
  currentUserId,
}: {
  review: ReviewWithAuthor;
  currentUserId: string | null;
}) {
  const [flagged, setFlagged] = useState(review.is_flagged);

  const initials = (review.author_name || "User")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const report = async () => {
    if (!currentUserId) {
      toast.error("Sign in to report");
      return;
    }
    const supabase = createClientSupabase();
    const { error } = await supabase
      .from("reviews")
      .update({ is_flagged: true, flag_reason: "user-reported" })
      .eq("id", review.id);
    if (error) {
      toast.error("Could not report");
    } else {
      setFlagged(true);
      toast.success("Reported. Admin will review.");
    }
  };

  const date = new Date(review.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="py-5 border-b border-border last:border-b-0">
      <header className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[11px] font-semibold text-text shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-text font-medium">
              {review.author_name || "Anonymous"}
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted num">
              {date}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn(
                    "h-3 w-3",
                    n <= review.rating ? "fill-text text-text" : "fill-none text-muted"
                  )}
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted num">
              {review.rating}.0
            </span>
          </div>
        </div>
      </header>

      <p className="mt-3 text-sm text-text leading-relaxed whitespace-pre-wrap">
        {review.text}
      </p>

      {review.photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {review.photos.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="h-24 w-24 object-cover rounded-sm border border-border shrink-0"
            />
          ))}
        </div>
      )}

      <footer className="mt-3 flex items-center justify-end">
        {flagged ? (
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
            Flagged for review
          </span>
        ) : (
          <button
            onClick={report}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted hover:text-text transition-colors"
          >
            <Flag className="h-3 w-3" /> Report
          </button>
        )}
      </footer>
    </article>
  );
}
