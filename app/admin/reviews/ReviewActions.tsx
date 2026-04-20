"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { dismissFlag, deleteReview } from "./actions";

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return toast.error(r.error ?? "Failed");
      toast.success(okMsg);
      router.refresh();
    });

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => run(() => dismissFlag(reviewId), "Flag dismissed")}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
        Dismiss
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this review permanently?")) return;
          run(() => deleteReview(reviewId), "Review deleted");
        }}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        Delete
      </Button>
    </div>
  );
}
