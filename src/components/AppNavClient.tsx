"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LEAGUE } from "@/lib/league-config";
import { fplKeys } from "@/lib/fpl/query-keys";

type NavLink = { href: string; label: string; admin?: boolean };

const PUBLIC_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/classic", label: "Classic" },
  { href: "/h2h", label: "H2H" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/winners", label: "Winners" },
  { href: "/stats", label: "Stats" },
  { href: "/motm", label: "MOTM" },
  { href: "/earnings", label: "Earnings" },
  { href: "/rules", label: "Rules" },
];

const ADMIN_LINKS: NavLink[] = [
  { href: "/admin/gameweek", label: "GW Desk", admin: true },
  { href: "/admin/suspensions", label: "Suspend", admin: true },
  { href: "/admin/payouts", label: "Payouts", admin: true },
];

export function AppNavClient({
  isAdmin,
  adminEmail,
  signOutAction,
}: {
  isAdmin: boolean;
  adminEmail: string | null;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const links = isAdmin ? [...PUBLIC_LINKS, ...ADMIN_LINKS] : PUBLIC_LINKS;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const prefetch = (href: string) => {
    if (href === "/") {
      void queryClient.prefetchQuery({
        queryKey: fplKeys.homeLeads,
        queryFn: () =>
          fetch("/api/fpl/home-leads").then((r) => {
            if (!r.ok) throw new Error("Failed");
            return r.json();
          }),
      });
    }
    if (href === "/classic") {
      void queryClient.prefetchQuery({
        queryKey: fplKeys.classicStandings,
        queryFn: () =>
          fetch("/api/fpl/classic-standings").then((r) => {
            if (!r.ok) throw new Error("Failed");
            return r.json();
          }),
      });
    }
    if (href === "/h2h") {
      void queryClient.prefetchQuery({
        queryKey: fplKeys.h2hStandings,
        queryFn: () =>
          fetch("/api/fpl/h2h-standings").then((r) => {
            if (!r.ok) throw new Error("Failed");
            return r.json();
          }),
      });
    }
  };

  const linkClass = (href: string) => {
    const active =
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`);
    return [
      "rounded-md px-2.5 py-2 text-sm transition sm:py-1.5",
      active
        ? "bg-united/30 font-semibold text-gold"
        : "text-white/70 hover:bg-united/20 hover:text-white",
    ].join(" ");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="group min-w-0 flex-1 leading-tight sm:flex-none"
        >
          <span className="block font-display text-base tracking-wide text-gold transition group-hover:text-white sm:text-xl">
            {LEAGUE.name}
          </span>
          <span className="mt-0.5 hidden text-[11px] uppercase tracking-[0.2em] text-white/50 sm:block">
            GGMU · Free to enter
          </span>
        </Link>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-2 text-sm text-white md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>

        <nav className="hidden flex-wrap items-center justify-end gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.href)}
              onMouseEnter={() => prefetch(link.href)}
              onFocus={() => prefetch(link.href)}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin ? (
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md px-2.5 py-1.5 text-sm text-white/50 transition hover:text-gold"
                title={adminEmail ?? undefined}
              >
                Sign out
              </button>
            </form>
          ) : null}
        </nav>
      </div>

      {open ? (
        <nav className="border-t border-white/10 px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass(link.href)}
                onClick={() => prefetch(link.href)}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin ? (
              <form action={signOutAction} className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-md border border-white/15 px-3 py-2 text-left text-sm text-white/60"
                >
                  Sign out{adminEmail ? ` · ${adminEmail}` : ""}
                </button>
              </form>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
