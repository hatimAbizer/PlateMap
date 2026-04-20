import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-bg text-text grid lg:grid-cols-[1.1fr_1fr]">
      {/* LEFT — editorial brand panel (hidden on mobile) */}
      <aside className="hidden lg:flex flex-col justify-between border-r border-border bg-surface/30 p-12 relative overflow-hidden">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <LogoMark size={28} />
          <span className="font-display text-lg font-semibold">PlateMap</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <div className="label-xs mb-5">Vol 1 · Bengaluru · 2026</div>
          <h1 className="font-display text-5xl leading-[1.02] tracking-tight font-medium">
            Your food identity,{" "}
            <span className="relative inline-block">
              on the map
              <span
                className="absolute -bottom-1 left-0 h-[3px] w-full bg-text"
                aria-hidden
              />
            </span>
            .
          </h1>
          <p className="mt-6 text-sm text-muted leading-relaxed">
            Halal. Vegetarian. Vegan. Jain. Color-coded so you don't have to
            second-guess a menu, a certification, or a cuisine tag again.
          </p>

          <div className="mt-10 grid grid-cols-4 gap-3">
            {[
              { c: "#795548", k: "Halal" },
              { c: "#388E3C", k: "Veg" },
              { c: "#7B1FA2", k: "Vegan" },
              { c: "#9E9E9E", k: "Jain" },
            ].map((d) => (
              <div
                key={d.k}
                className="flex flex-col items-start gap-2 p-3 rounded-md border border-border"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: d.c }}
                />
                <span className="text-[10px] uppercase tracking-[0.18em] text-text">
                  {d.k}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted">
          <span>12.9716°N · 77.5946°E</span>
          <span>PlateMap / v1.0</span>
        </div>
      </aside>

      {/* RIGHT — form panel */}
      <section className="flex flex-col">
        <header className="flex items-center justify-between px-6 lg:px-10 h-14 border-b border-border">
          <Link href="/" className="flex items-center gap-2 lg:invisible">
            <LogoMark size={22} />
            <span className="font-display text-sm font-semibold">PlateMap</span>
          </Link>
          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.18em] text-muted hover:text-text"
          >
            Back to map
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </section>
    </main>
  );
}
