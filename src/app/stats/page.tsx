import Link from "next/link";
import {
  buildSeasonLeaderboards,
  getSeasonStats,
} from "@/lib/season-stats";
import { ShareExportBar } from "@/components/ShareExportBar";

export const revalidate = 900;

export default async function StatsPage() {
  const data = await getSeasonStats();
  const boards = buildSeasonLeaderboards(data.managers);

  const csvRows = [
    [
      "manager",
      "team",
      "classic_motw",
      "h2h_motw",
      "classic_podium",
      "h2h_podium",
      "classic_top4",
      "motm_classic",
      "motm_h2h",
      "fraud_week_classic",
      "fraud_week_h2h",
      "fraud_month_classic",
      "fraud_month_h2h",
    ],
    ...data.managers.map((m) => [
      m.managerName,
      m.teamName,
      String(m.classicMotw),
      String(m.h2hMotw),
      String(m.classicPodium),
      String(m.h2hPodium),
      String(m.classicTop4),
      String(m.motmClassic),
      String(m.motmH2h),
      String(m.fraudWeekClassic),
      String(m.fraudWeekH2h),
      String(m.fraudMonthClassic),
      String(m.fraudMonthH2h),
    ]),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">
            Season records
          </p>
          <h1 className="mt-2 font-display text-4xl text-white">Glory Board</h1>
          <p className="mt-2 max-w-2xl text-white/60">
            Live tallies from finished gameweeks — same tie-breaks as{" "}
            <Link href="/winners" className="text-gold hover:underline">
              Winners
            </Link>
            . Cash paid is on{" "}
            <Link href="/earnings" className="text-gold hover:underline">
              Earnings
            </Link>
            .
          </p>
          <p className="mt-2 text-xs text-white/40">
            {data.finishedGwCount} finished GW
            {data.finishedGwCount === 1 ? "" : "s"} · {data.completedMonthCount}{" "}
            completed month
            {data.completedMonthCount === 1 ? "" : "s"} · refreshes about every
            15 min
          </p>
        </div>
        <ShareExportBar
          captureId="stats-capture"
          csvFilename="season-glory-stats.csv"
          csvRows={csvRows}
        />
      </div>

      <div id="stats-capture" className="mt-10 space-y-6">
        {data.finishedGwCount === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-white/45">
            No finished gameweeks yet — the board fills once GW1 is done.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {boards.map((board) => (
              <section
                key={board.key}
                className="overflow-hidden rounded-2xl border border-white/10 bg-panel/40"
              >
                <div className="border-b border-white/10 bg-united/20 px-4 py-3">
                  <h2 className="font-display text-lg text-white">{board.title}</h2>
                  <p className="text-xs text-white/50">{board.blurb}</p>
                </div>
                {board.rows.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-white/40">
                    Nobody on this board yet.
                  </p>
                ) : (
                  <ol className="divide-y divide-white/5">
                    {board.rows.map((row, i) => (
                      <li
                        key={`${board.key}-${row.entryId}`}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-white">
                            <span className="mr-2 tabular-nums text-white/35">
                              {i + 1}.
                            </span>
                            {row.managerName}
                          </p>
                          <p className="truncate text-xs text-white/45">
                            {row.teamName}
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold tabular-nums text-gold">
                          {row.count}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
