"use client";

import { useClassicStandings } from "@/hooks/useClassicStandings";
import {
  RankBadge,
  RankDelta,
  StandingsTable,
} from "@/components/StandingsTable";
import { PrizeRulesLegend } from "@/components/PrizeRulesLegend";
import { ShareExportBar } from "@/components/ShareExportBar";

export function ClassicStandingsClient() {
  const { data, isPending, isError, error } = useClassicStandings();

  if (isPending) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Classic</p>
        <h1 className="mt-2 font-display text-4xl text-white">
          League standings
        </h1>
        <div className="mt-8 h-64 animate-pulse rounded-2xl border border-white/10 bg-panel/40" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Classic</p>
        <h1 className="mt-2 font-display text-4xl text-white">
          League standings
        </h1>
        <div className="mt-8 rounded-2xl border border-united/40 bg-united/10 px-6 py-8 text-white/80">
          <p className="font-semibold text-white">Could not load standings</p>
          <p className="mt-2 text-sm text-white/60">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  const { league, results, hidden, code, gw } = data;
  const csvRows = [
    ["rank", "manager", "team", "gw", "total"],
    ...results.map((r) => [
      String(r.rank),
      r.player_name,
      r.entry_name,
      String(r.event_total),
      String(r.total),
    ]),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Classic</p>
          <h1 className="mt-2 font-display text-4xl text-white">
            {league.name || "League standings"}
          </h1>
          <p className="mt-3 text-white/60">
            Live standings · code{" "}
            <span className="font-mono text-white">{code}</span>
            {gw ? (
              <>
                {" "}
                · <span className="text-gold">{gw.name}</span>
              </>
            ) : null}
          </p>
        </div>
        <ShareExportBar
          captureId="classic-table-capture"
          csvFilename="classic-standings.csv"
          csvRows={csvRows}
        />
      </div>

      <div className="mt-6">
        <PrizeRulesLegend compact />
      </div>

      <div id="classic-table-capture" className="mt-8 space-y-4">
        <StandingsTable
          rows={results}
          columns={[
            {
              key: "rank",
              header: "Rank",
              render: (row) => <RankBadge rank={row.rank} />,
            },
            {
              key: "delta",
              header: "Δ",
              render: (row) => (
                <RankDelta rank={row.rank} lastRank={row.last_rank} />
              ),
            },
            {
              key: "manager",
              header: "Manager",
              render: (row) => row.player_name,
            },
            {
              key: "team",
              header: "Team",
              render: (row) => (
                <span className="text-white/80">{row.entry_name}</span>
              ),
            },
            {
              key: "gw",
              header: "GW",
              align: "right",
              render: (row) => (
                <span className="tabular-nums">{row.event_total}</span>
              ),
            },
            {
              key: "total",
              header: "Total",
              align: "right",
              render: (row) => (
                <span className="font-semibold tabular-nums text-gold">
                  {row.total}
                </span>
              ),
            },
          ]}
        />
        <p className="text-xs text-white/40">
          GW points from each manager&apos;s FPL entry history (same source as
          Winners). Rank re-sorted by corrected season total. Weekly cash still
          uses GW points + house tie-breaks.
          {hidden > 0
            ? ` · ${hidden} suspended manager${hidden === 1 ? "" : "s"} hidden from house standings.`
            : ""}
        </p>
      </div>
    </div>
  );
}
