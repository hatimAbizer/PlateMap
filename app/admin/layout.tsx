import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Logo } from "@/components/layout/Logo";
import { UserMenu } from "@/components/layout/UserMenu";

export const metadata = { title: { default: "Admin", template: "%s · Admin" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: admin } = await supabase
    .from("admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) redirect("/");

  return (
    <div className="min-h-[100dvh] bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <Logo />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted border-l border-border pl-3">
                Admin
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-[11px] uppercase tracking-[0.14em]">
              <Link href="/admin" className="text-muted hover:text-text transition-colors">Overview</Link>
              <Link href="/admin/claims" className="text-muted hover:text-text transition-colors">Claims</Link>
              <Link href="/admin/restaurants" className="text-muted hover:text-text transition-colors">Restaurants</Link>
              <Link href="/admin/reviews" className="text-muted hover:text-text transition-colors">Flagged</Link>
            </nav>
          </div>
          <UserMenu email={user.email ?? ""} />
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 md:py-12">{children}</main>
    </div>
  );
}
