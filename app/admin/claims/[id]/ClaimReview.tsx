"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approveClaim, rejectClaim, signProofUrl } from "./actions";

export function ClaimReview({
  claimId,
  status,
  proofPath,
}: {
  claimId: string;
  status: "pending" | "approved" | "rejected";
  proofPath: string | null;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const [signing, setSigning] = useState(false);

  const approve = () =>
    start(async () => {
      const r = await approveClaim(claimId);
      if (!r.ok) {
        toast.error(r.error ?? "Failed");
        return;
      }
      toast.success("Claim approved. Owner can now manage the listing.");
      router.refresh();
    });

  const reject = () =>
    start(async () => {
      const r = await rejectClaim(claimId, reason.trim());
      if (!r.ok) {
        toast.error(r.error ?? "Failed");
        return;
      }
      toast.success("Claim rejected.");
      router.refresh();
    });

  const openProof = async () => {
    if (!proofPath) return;
    setSigning(true);
    const r = await signProofUrl(proofPath);
    setSigning(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    window.open(r.url, "_blank", "noopener,noreferrer");
  };

  if (status !== "pending") {
    return (
      <div className="border border-border rounded-md p-5">
        <div className="label-xs mb-1">Status</div>
        <p className="text-sm text-text capitalize">{status}</p>
        {proofPath && (
          <button
            onClick={openProof}
            disabled={signing}
            className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:text-text transition-colors"
          >
            {signing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
            Open proof document
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {proofPath && (
        <div className="border border-border rounded-md p-5">
          <div className="label-xs mb-2">Proof document</div>
          <p className="text-sm text-muted mb-3">Opens in a new tab. Link expires in 5 minutes.</p>
          <button
            onClick={openProof}
            disabled={signing}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] font-semibold text-text hover:text-muted transition-colors"
          >
            {signing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
            View document
          </button>
        </div>
      )}

      <div className="border border-border rounded-md p-5">
        <div className="label-xs mb-2">Reject with reason</div>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional. Shown to the claimant."
          className="min-h-[80px]"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        <Button variant="ghost" onClick={reject} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Reject
        </Button>
        <Button onClick={approve} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Approve
        </Button>
      </div>
    </div>
  );
}
