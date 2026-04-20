import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createServerSupabase } from "@/lib/supabase/server";
import { UserMenu } from "@/components/layout/UserMenu";
import { Logo } from "@/components/layout/Logo";

export async function Navbar({ variant = "default" }: { variant?: "default" | "overlay" }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header
      className={
        variant === "overlay"
          ? "pointer-events-none absolute inset-x-0 top-0 z-[500]"
          : "sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-sm"
      }
    >
      <div
        className={
          variant === "overlay"
            ? "pointer-events-auto mx-auto flex h-14 max-w-[1800px] items-center justify-between px-3 sm:px-4"
            : "mx-auto flex h-14 max-w-[1800px] items-center justify-between px-4 sm:px-6"
        }
      >
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/search"
            className="hidden sm:inline-flex h-9 items-center px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:text-text transition-colors"
          >
            Search
          </Link>
          {user ? (
            <UserMenu email={user.email ?? ""} />
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-xs uppercase tracking-[0.14em]"
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="text-xs uppercase tracking-[0.14em]">
                <Link href="/register">Create account</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
