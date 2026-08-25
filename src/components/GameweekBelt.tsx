"use client";

import Link from "next/link";

export type BeltGw = {
  id: number;
  name: string;
  finished: boolean;
  isCurrent: boolean;
};

/** Pathname only — query `?gw=` is appended inside this client component. */
export function GameweekBelt({
  gameweeks,
  selectedGw,
  pathname,
}: {
  gameweeks: BeltGw[];
  selectedGw: number;
  pathname: string;
}) {
  const hrefForGw = (gw: number) => `${pathname}?gw=${gw}`;
  const maxId = gameweeks.at(-1)?.id ?? 38;
  const prev = Math.max(1, selectedGw - 1);
  const next = Math.min(maxId, selectedGw + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link
          href={hrefForGw(prev)}
          aria-disabled={selectedGw <= 1}
          className={`rounded-md border px-3 py-2 text-sm ${
            selectedGw <= 1
              ? "pointer-events-none border-white/10 text-white/30"
              : "border-white/20 text-white/80 hover:border-gold/40 hover:text-gold"
          }`}
        >
          ← Prev
        </Link>
        <p className="flex-1 text-center text-sm text-white/60">
          <span className="font-semibold text-gold">GW{selectedGw}</span>
          {gameweeks.find((g) => g.id === selectedGw)?.isCurrent
            ? " · current"
            : ""}
          {gameweeks.find((g) => g.id === selectedGw)?.finished
            ? " · finished"
            : ""}
        </p>
        <Link
          href={hrefForGw(next)}
          aria-disabled={selectedGw >= maxId}
          className={`rounded-md border px-3 py-2 text-sm ${
            selectedGw >= maxId
              ? "pointer-events-none border-white/10 text-white/30"
              : "border-white/20 text-white/80 hover:border-gold/40 hover:text-gold"
          }`}
        >
          Next →
        </Link>
      </div>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex w-max gap-1.5">
          {gameweeks.map((g) => {
            const active = g.id === selectedGw;
            return (
              <Link
                key={g.id}
                href={hrefForGw(g.id)}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs tabular-nums transition ${
                  active
                    ? "bg-gold text-ink"
                    : g.isCurrent
                      ? "border border-gold/40 text-gold"
                      : g.finished
                        ? "border border-white/15 text-white/70"
                        : "border border-dashed border-white/10 text-white/40"
                }`}
              >
                {g.id}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
