"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { createClientSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STEPS = ["Contact", "Proof", "Review"] as const;
type Step = (typeof STEPS)[number];

export function ClaimForm({
  restaurantId,
  userId,
  email,
}: {
  restaurantId: string;
  userId: string;
  email: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("Contact");
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("Owner");
  const [bizEmail, setBizEmail] = useState(email);
  const [phone, setPhone] = useState("");
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const canStep2 = name.trim() && designation && bizEmail && phone.trim().length >= 7;
  const canStep3 = canStep2 && !!docUrl;

  const upload = async (f: File | null) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return toast.error("Max 8MB");
    setUploading(true);
    const supabase = createClientSupabase();
    const ext = f.name.split(".").pop() || "pdf";
    const path = `${userId}/${restaurantId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("claim-docs")
      .upload(path, f, { cacheControl: "3600", upsert: false });
    if (error) {
      toast.error(error.message);
    } else {
      setDocUrl(path);
      toast.success("Document uploaded");
    }
    setUploading(false);
  };

  const submit = () => {
    if (!canStep3) return;
    startTransition(async () => {
      const supabase = createClientSupabase();
      const { error } = await supabase.from("claims").insert({
        restaurant_id: restaurantId,
        claimant_user_id: userId,
        claimant_name: name,
        designation,
        business_email: bizEmail,
        phone,
        proof_doc_url: docUrl,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Claim submitted");
      router.refresh();
    });
  };

  return (
    <div>
      <Stepper current={step} />

      {step === "Contact" && (
        <section className="mt-8 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Your name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Designation">
              <Select value={designation} onValueChange={setDesignation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="PR / Marketing">PR / Marketing</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Business email" hint="Used for admin decision notice">
              <Input
                type="email"
                value={bizEmail}
                onChange={(e) => setBizEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 ..."
                required
              />
            </Field>
          </div>
          <div className="pt-2 flex justify-end">
            <Button onClick={() => setStep("Proof")} disabled={!canStep2}>
              Next
            </Button>
          </div>
        </section>
      )}

      {step === "Proof" && (
        <section className="mt-8 space-y-4">
          <p className="text-sm text-muted leading-relaxed max-w-lg">
            Upload one of: FSSAI license, GST certificate, or business
            registration. PDF, JPG, or PNG. Private — only PlateMap admins
            can view.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={cn(
              "w-full border border-dashed border-border rounded-md p-10 flex flex-col items-center justify-center gap-3 hover:border-muted transition-colors",
              docUrl && "border-verified/60"
            )}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
            ) : docUrl ? (
              <Check className="h-6 w-6 text-verified" />
            ) : (
              <Upload className="h-6 w-6 text-muted" />
            )}
            <div className="text-xs uppercase tracking-[0.14em] text-text">
              {docUrl ? "Uploaded" : uploading ? "Uploading…" : "Click to upload"}
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Max 8MB · PDF / JPG / PNG
            </div>
          </button>
          <div className="pt-2 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep("Contact")}>
              Back
            </Button>
            <Button onClick={() => setStep("Review")} disabled={!canStep3}>
              Next
            </Button>
          </div>
        </section>
      )}

      {step === "Review" && (
        <section className="mt-8 space-y-4">
          <div className="border border-border rounded-md divide-y divide-border">
            <Row label="Name" value={name} />
            <Row label="Designation" value={designation} />
            <Row label="Business email" value={bizEmail} />
            <Row label="Phone" value={phone} />
            <Row
              label="Proof doc"
              value={
                docUrl ? (
                  <span className="text-verified">Uploaded</span>
                ) : (
                  <span className="text-red-400">Missing</span>
                )
              }
            />
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            By submitting, you confirm the information above is accurate and
            that you are authorised to represent this restaurant.
          </p>

          <div className="pt-2 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep("Proof")}>
              Back
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit claim
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  return (
    <ol className="flex items-center gap-3">
      {STEPS.map((s, i) => {
        const done = STEPS.indexOf(current) > i;
        const active = current === s;
        return (
          <li key={s} className="flex items-center gap-3 flex-1">
            <div
              className={cn(
                "h-7 w-7 rounded-full border flex items-center justify-center text-[11px] font-semibold shrink-0",
                done
                  ? "bg-text text-bg border-text"
                  : active
                    ? "border-text text-text"
                    : "border-border text-muted"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-[10px] uppercase tracking-[0.14em] font-semibold",
                active ? "text-text" : "text-muted"
              )}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px bg-border ml-1" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block uppercase tracking-[0.14em]">{label}</Label>
      {children}
      {hint && <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">{hint}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[10px] uppercase tracking-[0.14em] text-muted">{label}</span>
      <span className="text-sm text-text">{value}</span>
    </div>
  );
}
