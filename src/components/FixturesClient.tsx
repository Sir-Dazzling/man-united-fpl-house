"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { GameweekBelt } from "@/components/GameweekBelt";
import { fetchJson, fplKeys } from "@/lib/fpl/query-keys";

type FixturesPayload = {
  gw: number;
  code: string;
  meta: {
    id: number;
    name: string;
    finished: boolean;
    isCurrent: boolean;
    deadline: string;
  } | null;
  gameweeks: Array<{
    id: number;
    name: string;
    finished: boolean;
    isCurrent: boolean;
  }>;
  matches: Array<{
    id: number;
    isBye: boolean;
    entry1: {
      entryId: number;
      teamName: string;
      managerName: string;
      points: number | null;
    } | null;
    entry2: {
      entryId: number;
      teamName: string;
      managerName: string;
      points: number | null;
    } | null;
  }>;
};

export function FixturesClient() {
  const params = useSearchParams();
  const gwParam = params.get("gw");
  const gw = gwParam ? Number(gwParam) : undefined;

  const { data, isPending, isError, error } = useQuery({
    queryKey: fplKeys.h2hFixtures(gw ?? 0),
    queryFn: () =>
      fetchJson<FixturesPayload>(
        `/api/fpl/h2h-fixtures${gw ? `?gw=${gw}` : ""}`,
      ),
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Fixtures</p>
        <h1 className="mt-2 font-display text-4xl text-white">H2H results</h1>
        <div className="mt-8 h-48 animate-pulse rounded-2xl border border-white/10 bg-panel/40" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Fixtures</p>
        <h1 className="mt-2 font-display text-4xl text-white">H2H results</h1>
        <p className="mt-6 text-sm text-white/60">
          {error instanceof Error ? error.message : "Could not load fixtures."}
        </p>
      </div>
    );
  }

  const selected = data.gw;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">Fixtures</p>
      <h1 className="mt-2 font-display text-4xl text-white">
        H2H · {data.meta?.name ?? `GW${selected}`}
      </h1>
      <p className="mt-2 text-white/60">
        Results and upcoming ties · code{" "}
        <span className="font-mono text-white">{data.code}</span>
      </p>

      <div className="mt-6">
        <GameweekBelt
          gameweeks={data.gameweeks}
          selectedGw={selected}
          pathname="/fixtures"
        />
      </div>

      <ul className="mt-8 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-panel/40">
        {data.matches.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-white/45">
            No fixtures for this gameweek.
          </li>
        ) : (
          data.matches.map((m) => {
            if (m.isBye) {
              const side = m.entry1 ?? m.entry2;
              return (
                <li key={m.id} className="px-4 py-4 text-sm text-white/55">
                  {side ? (
                    <>
                      <span className="font-medium text-white">
                        {side.teamName}
                      </span>{" "}
                      has a bye
                    </>
                  ) : (
                    "Bye"
                  )}
                </li>
              );
            }
            const a = m.entry1;
            const b = m.entry2;
            const played =
              a?.points != null && b?.points != null && (a.points > 0 || b.points > 0 || data.meta?.finished);
            return (
              <li
                key={m.id}
                className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center"
              >
                <Side
                  team={a?.teamName ?? "TBD"}
                  manager={a?.managerName ?? ""}
                  align="left"
                />
                <div className="text-center">
                  {played ? (
                    <p className="font-display text-2xl tabular-nums text-gold">
                      {a?.points ?? 0} – {b?.points ?? 0}
                    </p>
                  ) : (
                    <p className="text-sm uppercase tracking-wider text-white/40">
                      vs
                    </p>
                  )}
                </div>
                <Side
                  team={b?.teamName ?? "TBD"}
                  manager={b?.managerName ?? ""}
                  align="right"
                />
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function Side({
  team,
  manager,
  align,
}: {
  team: string;
  manager: string;
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p className="font-medium text-white">{team}</p>
      <p className="text-xs text-white/50">{manager}</p>
    </div>
  );
}
