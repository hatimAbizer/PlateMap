import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg mt-24">
      <div className="mx-auto max-w-[1800px] px-6 py-10 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-text">
            <LogoMark />
            <span className="font-display text-sm font-semibold">PlateMap</span>
          </div>
          <p className="text-xs text-muted leading-relaxed max-w-sm">
            A map-first restaurant finder for India's dietary communities.
            Halal, Vegetarian, Vegan, and Jain — color-coded so you don't have to search.
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
            Bengaluru · April 2026 · v1.0
          </p>
        </div>

        <FooterCol
          title="Explore"
          items={[
            { href: "/", label: "Map" },
            { href: "/search", label: "Search" },
            { href: "/search?cat=halal", label: "Halal" },
            { href: "/search?cat=veg", label: "Vegetarian" },
            { href: "/search?cat=vegan", label: "Vegan" },
            { href: "/search?cat=jain", label: "Jain" },
          ]}
        />
        <FooterCol
          title="Platform"
          items={[
            { href: "/login", label: "Sign in" },
            { href: "/register", label: "Create account" },
            { href: "/profile", label: "Profile" },
            { href: "#", label: "Claim a listing" },
            { href: "#", label: "Privacy" },
            { href: "#", label: "Terms" },
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-[1800px] px-6 py-4 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted">
          <span>© 2026 PlateMap</span>
          <span>Made in Bengaluru</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div>
      <div className="label-xs mb-3">{title}</div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              className="text-xs text-text hover:text-muted transition-colors"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
