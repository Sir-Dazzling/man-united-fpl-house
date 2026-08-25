import Link from "next/link";
import { LEAGUE } from "@/lib/league-config";

const links = [
  { href: "/", label: "Home" },
  { href: "/classic", label: "Classic" },
  { href: "/h2h", label: "H2H" },
  { href: "/earnings", label: "Earnings" },
  { href: "/admin/payouts", label: "Payouts" },
] as const;

export function AppNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex flex-col leading-tight">
          <span className="font-display text-lg tracking-wide text-gold transition group-hover:text-white sm:text-xl">
            {LEAGUE.name}
          </span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/50">
            GGMU · Free to enter
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-white/70 transition hover:bg-united/20 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
