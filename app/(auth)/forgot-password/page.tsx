"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { createClientSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const supabase = createClientSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your inbox");
  };

  return (
    <div>
      <div className="label-xs mb-3">Recovery</div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Reset password.
      </h1>
      <p className="text-sm text-muted mt-2">
        We'll email you a link. Click it to set a new password.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email" className="mb-1.5 block uppercase tracking-[0.14em]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={sending || sent} className="w-full h-10 text-sm uppercase tracking-[0.14em]">
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          {sent ? "Sent" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-xs text-muted">
        <Link href="/login" className="text-text hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
