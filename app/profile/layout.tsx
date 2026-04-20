import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-bg text-text">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-8 md:py-12">
        <div className="label-xs mb-2">Account</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          Profile
        </h1>

        <nav className="mt-6 flex gap-1 border-b border-border overflow-x-auto">
          <TabLink href="/profile">Preferences</TabLink>
          <TabLink href="/profile/favourites">Favourites</TabLink>
          <TabLink href="/profile/reviews">Reviews</TabLink>
        </nav>

        <div className="mt-8">{children}</div>
      </div>
      <Footer />
    </main>
  );
}

function TabLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative px-4 py-3 text-xs uppercase tracking-[0.14em] font-semibold text-muted hover:text-text transition-colors data-[active=true]:text-text"
    >
      {children}
    </Link>
  );
}
