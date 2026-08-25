"use client";

import { useH2hStandings } from "@/hooks/useH2hStandings";
import {
  RankBadge,
  RankDelta,
  StandingsTable,
} from "@/components/StandingsTable";
import { PrizeRulesLegend } from "@/components/PrizeRulesLegend";
import { ShareExportBar } from "@/components/ShareExportBar";

export function H2hStandingsClient() {
  const { data, isPending, isError, error } = useH2hStandings();

  if (isPending) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">
          Head-to-Head
        </p>
        <h1 className="mt-2 font-display text-4xl text-white">H2H standings</h1>
        <div className="mt-8 h-64 animate-pulse rounded-2xl border border-white/10 bg-panel/40" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">
          Head-to-Head
        </p>
        <h1 className="mt-2 font-display text-4xl text-white">H2H standings</h1>
        <div className="mt-8 rounded-2xl border border-united/40 bg-united/10 px-6 py-8">
          <p className="font-semibold text-white">Could not load standings</p>
          <p className="mt-2 text-sm text-white/60">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  const { league, results, hidden, code, gw, topPf, topPa } = data;
  const csvRows = [
    ["rank", "manager", "team", "wdl", "pf", "pa", "pts"],
    ...results.map((r) => [
      String(r.rank),
      r.player_name,
      r.entry_name,
      `${r.matches_won}-${r.matches_drawn}-${r.matches_lost}`,
      String(r.points_for),
      String(r.points_against ?? 0),
      String(r.total),
    ]),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">
            Head-to-Head
          </p>
          <h1 className="mt-2 font-display text-4xl text-white">
            {league.name || "H2H standings"}
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
          captureId="h2h-table-capture"
          csvFilename="h2h-standings.csv"
          csvRows={csvRows}
        />
      </div>

      <div className="mt-6">
        <PrizeRulesLegend compact />
      </div>

      <div id="h2h-table-capture" className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <SpecialCard
            title="Most Goals Scored"
            subtitle="Season PF special (EOS)"
            manager={topPf?.player_name}
            value={topPf ? `${topPf.points_for} PF` : "—"}
          />
          <SpecialCard
            title="Fewest Goals Conceded"
            subtitle="Season PA special (EOS)"
            manager={topPa?.player_name}
            value={
              topPa != null
                ? `${topPa.points_against ?? 0} PA`
                : "—"
            }
          />
        </div>

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
              render: (row) => {
                const isPf = topPf?.id === row.id;
                const isPa = topPa?.id === row.id;
                return (
                  <span>
                    {row.player_name}
                    {isPf ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-gold">
                        PF lead
                      </span>
                    ) : null}
                    {isPa ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-400">
                        PA lead
                      </span>
                    ) : null}
                  </span>
                );
              },
            },
            {
              key: "team",
              header: "Team",
              render: (row) => (
                <span className="text-white/80">{row.entry_name}</span>
              ),
            },
            {
              key: "record",
              header: "W-D-L",
              align: "center",
              render: (row) => (
                <span className="tabular-nums text-white/80">
                  {row.matches_won}-{row.matches_drawn}-{row.matches_lost}
                </span>
              ),
            },
            {
              key: "pf",
              header: "PF",
              align: "right",
              render: (row) => (
                <span className="tabular-nums">{row.points_for}</span>
              ),
            },
            {
              key: "pa",
              header: "PA",
              align: "right",
              render: (row) => (
                <span className="tabular-nums">{row.points_against ?? 0}</span>
              ),
            },
            {
              key: "total",
              header: "Pts",
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
          Weekly H2H cash = win your match then best margin — not this season
          table alone. Monthly table cash uses this cumulative rank.
          {hidden > 0
            ? ` · ${hidden} suspended manager${hidden === 1 ? "" : "s"} hidden from house standings.`
            : ""}
        </p>
      </div>
    </div>
  );
}

function SpecialCard({
  title,
  subtitle,
  manager,
  value,
}: {
  title: string;
  subtitle: string;
  manager?: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/10 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">{title}</p>
      <p className="mt-1 text-xs text-white/50">{subtitle}</p>
      <p className="mt-3 font-display text-2xl text-white">{manager ?? "—"}</p>
      <p className="mt-1 text-sm font-semibold text-gold">{value}</p>
    </div>
  );
}
