"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClientSupabase } from "@/lib/supabase/client";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewRow } from "@/types/database";
import { cn } from "@/lib/utils";

const MIN = 20;
const MAX = 500;

export function ReviewForm({
  restaurantId,
  userId,
  existing,
}: {
  restaurantId: string;
  userId: string;
  existing: ReviewRow | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState<number>(existing?.rating ?? 0);
  const [text, setText] = useState<string>(existing?.text ?? "");
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const valid = rating >= 1 && text.trim().length >= MIN && text.length <= MAX;

  const submit = () => {
    if (!valid) return;
    startTransition(async () => {
      const supabase = createClientSupabase();
      if (existing) {
        const { error } = await supabase
          .from("reviews")
          .update({ rating, text, photos })
          .eq("id", existing.id);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Review updated");
      } else {
        const { error } = await supabase.from("reviews").insert({
          restaurant_id: restaurantId,
          user_id: userId,
          rating,
          text,
          photos,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Review posted");
      }
      router.refresh();
    });
  };

  const remove = () => {
    if (!existing) return;
    startTransition(async () => {
      const supabase = createClientSupabase();
      const { error } = await supabase.from("reviews").delete().eq("id", existing.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Review removed");
      setRating(0);
      setText("");
      setPhotos([]);
      router.refresh();
    });
  };

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (photos.length + files.length > 3) {
      toast.error("Max 3 photos");
      return;
    }
    const supabase = createClientSupabase();
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 5MB`);
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${restaurantId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("review-photos")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) {
          toast.error(error.message);
          continue;
        }
        const { data } = supabase.storage.from("review-photos").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setPhotos((p) => [...p, ...uploaded]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="rounded-md border border-border bg-surface/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="label-xs">
          {existing ? "Your review" : "Write a review"}
        </div>
        <StarRating value={rating} onChange={setRating} size={18} />
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX))}
        placeholder="What did you order? How was it? (min 20 characters)"
        className="bg-bg"
      />

      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-muted">
        <span
          className={cn(
            "num",
            text.length < MIN && text.length > 0 && "text-amber-400",
            text.length === MAX && "text-red-400"
          )}
        >
          {text.length} / {MAX}
        </span>
        <span>Min {MIN} chars</span>
      </div>

      {photos.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {photos.map((src) => (
            <div key={src} className="relative group">
              <img
                src={src}
                alt=""
                className="h-20 w-20 object-cover rounded-sm border border-border"
              />
              <button
                onClick={() => setPhotos((p) => p.filter((x) => x !== src))}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-bg border border-border flex items-center justify-center text-muted hover:text-text"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={uploading || photos.length >= 3}
          onClick={() => fileRef.current?.click()}
          className="text-xs uppercase tracking-[0.14em]"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}
          Add photo ({photos.length}/3)
        </Button>

        <div className="flex items-center gap-2">
          {existing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={remove}
              disabled={pending}
              className="text-xs uppercase tracking-[0.14em] text-muted hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
          <Button
            size="sm"
            disabled={!valid || pending}
            onClick={submit}
            className="text-xs uppercase tracking-[0.14em]"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {existing ? "Update" : "Post review"}
          </Button>
        </div>
      </div>
    </div>
  );
}
