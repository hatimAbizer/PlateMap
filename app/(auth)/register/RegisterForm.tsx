"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClientSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIETARY_ORDER, DIETARY } from "@/lib/dietary";
import { cn } from "@/lib/utils";

type Pref = "none" | "halal" | "veg" | "vegan" | "jain";

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pref, setPref] = useState<Pref>("none");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    startTransition(async () => {
      const supabase = createClientSupabase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: name },
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data.user && pref !== "none") {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          dietary_preference: pref,
          name,
        });
      } else if (data.user && name) {
        await supabase.from("profiles").upsert({ id: data.user.id, name });
      }
      toast.success("Account created");
      router.refresh();
      router.push(next || "/");
    });
  };

  const googleSignIn = async () => {
    const supabase = createClientSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${
          next ? `?next=${encodeURIComponent(next)}` : ""
        }`,
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Button type="button" variant="outline" className="w-full h-10 text-sm normal-case" onClick={googleSignIn}>
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-muted">
        <div className="flex-1 h-px bg-border" />
        or
        <div className="flex-1 h-px bg-border" />
      </div>

      <div>
        <Label htmlFor="name" className="mb-1.5 block uppercase tracking-[0.14em]">Full name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="email" className="mb-1.5 block uppercase tracking-[0.14em]">Email</Label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="password" className="mb-1.5 block uppercase tracking-[0.14em]">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-[10px] text-muted mt-1 uppercase tracking-[0.14em]">6+ chars</p>
      </div>

      <div>
        <Label className="mb-2 block uppercase tracking-[0.14em]">Dietary preference (optional)</Label>
        <div className="grid grid-cols-5 gap-1.5">
          <PrefChip active={pref === "none"} onClick={() => setPref("none")} label="None" />
          {DIETARY_ORDER.map((k) => (
            <PrefChip
              key={k}
              active={pref === k}
              onClick={() => setPref(k)}
              label={DIETARY[k].label.slice(0, 4)}
              color={DIETARY[k].color}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted mt-2 leading-relaxed">
          We'll default the map to this on sign-in. Change anytime.
        </p>
      </div>

      <Button type="submit" disabled={pending} className="w-full h-10 text-sm uppercase tracking-[0.14em]">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}

function PrefChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-md border text-[10px] uppercase tracking-[0.14em] font-semibold transition-all",
        active
          ? "border-text text-text bg-surface"
          : "border-border text-muted hover:text-text hover:border-muted"
      )}
      style={
        active && color
          ? { borderColor: color, boxShadow: `inset 0 0 0 1px ${color}` }
          : undefined
      }
    >
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.8-2 13.3-5.2l-6.1-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.1 5.2c3.7-3.4 6.1-8.4 6.1-14.3 0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
