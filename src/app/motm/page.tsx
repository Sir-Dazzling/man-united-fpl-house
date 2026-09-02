import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  confirmClassicMonthlyAndRedirect,
  confirmClassicMotmAndRedirect,
  confirmH2hMonthlyAndRedirect,
  confirmH2hMotmAndRedirect,
  markMotmPaidAndRedirect,
} from "@/lib/confirm-actions";
import {
  getBootstrapStatic,
  getSeasonMonths,
  isMonthFullyPlayed,
} from "@/lib/fpl/client";
import { CLASSIC_LABELS, H2H_LABELS } from "@/lib/fpl-labels";
import {
  getClassicMonthStats,
  getH2hMonthStats,
  type ClassicMonthRow,
  type H2hMonthRow,
} from "@/lib/month-stats";
import {
  resolveClassicMonthlyTable,
  resolveClassicMotm,
  resolveH2hMonthlyTable,
  resolveH2hMotm,
} from "@/lib/winners";
import { FraudCard, WinnersPreviewTable } from "@/components/WinnersPreview";
import { AdminFlashBanner } from "@/components/AdminFlashBanner";
import { AdminPayoutWorkflow } from "@/components/AdminPayoutWorkflow";
import {
  MotmAwardCard,
  MotmLockedCard,
  type MotmStat,
} from "@/components/MotmAwardCard";
import { PrizeRulesLegend } from "@/components/PrizeRulesLegend";
import { ShareExportBar } from "@/components/ShareExportBar";
import { formatNgn, PRIZES } from "@/lib/league-config";
import type { PayoutWorkflowRow } from "@/lib/payout-workflow";
import type { ResolvedWinner } from "@/lib/winners";

export const dynamic = "force-dynamic";

export default async function MotmPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; msg?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const seasonMonths = await getSeasonMonths();
  const now = new Date();
  const defaultMonth =
    seasonMonths.find(
      (m) =>
        m.year === now.getUTCFullYear() &&
        m.monthIndex === now.getUTCMonth(),
    ) ??
    seasonMonths[0] ?? {
      year: 2026,
      monthIndex: 7,
    };

  let year = Number(params.year ?? defaultMonth.year);
  let monthIndex = Number(params.month ?? defaultMonth.monthIndex);
  const inSeason = seasonMonths.some(
    (m) => m.year === year && m.monthIndex === monthIndex,
  );
  if (!inSeason) {
    year = defaultMonth.year;
    monthIndex = defaultMonth.monthIndex;
  }
  const monthKey = year * 100 + (monthIndex + 1);

  const bootstrap = await getBootstrapStatic();
  const monthGws = bootstrap.events.filter((e) => {
    const d = new Date(e.deadline_time);
    return d.getUTCFullYear() === year && d.getUTCMonth() === monthIndex;
  });
  const monthStatus = await isMonthFullyPlayed(year, monthIndex);
  const finished = monthStatus.finished;
  const throughGw = finished.at(-1)?.id ?? monthGws[0]?.id ?? 1;
  const monthlyReady = monthStatus.ready;

  let cMotm: Awaited<ReturnType<typeof resolveClassicMotm>> | null = null;
  let hMotm: Awaited<ReturnType<typeof resolveH2hMotm>> | null = null;
  let cMonth: { winners: ResolvedWinner[] } = { winners: [] };
  let hMonth: { winners: ResolvedWinner[] } = { winners: [] };
  let classicMonthRows: ClassicMonthRow[] = [];
  let h2hMonthRows: H2hMonthRow[] = [];

  if (monthlyReady) {
    const [cMotmRes, hMotmRes, cMonthRes, hMonthRes, classicStats, h2hStats] =
      await Promise.all([
        resolveClassicMotm(year, monthIndex),
        resolveH2hMotm(year, monthIndex),
        resolveClassicMonthlyTable(year, monthIndex),
        resolveH2hMonthlyTable(year, monthIndex),
        getClassicMonthStats(year, monthIndex),
        getH2hMonthStats(year, monthIndex),
      ]);
    cMotm = cMotmRes;
    hMotm = hMotmRes;
    cMonth = cMonthRes;
    hMonth = hMonthRes;
    classicMonthRows = classicStats.rows;
    h2hMonthRows = h2hStats.rows;
  }

  const monthPayouts = monthlyReady
    ? await prisma.payout.findMany({
        where: {
          gameweek: monthKey,
          category: {
            in: [
              "motm_classic",
              "motm_h2h",
              "classic_monthly",
              "h2h_monthly",
            ],
          },
        },
        orderBy: { amountNgn: "desc" },
      })
    : [];

  const motmClassicPayouts = mapPayoutRows(
    monthPayouts.filter((p) => p.category === "motm_classic"),
  );
  const motmH2hPayouts = mapPayoutRows(
    monthPayouts.filter((p) => p.category === "motm_h2h"),
  );
  const classicMonthlyPayouts = mapPayoutRows(
    monthPayouts.filter((p) => p.category === "classic_monthly"),
  );
  const h2hMonthlyPayouts = mapPayoutRows(
    monthPayouts.filter((p) => p.category === "h2h_monthly"),
  );

  const monthHidden = {
    year,
    monthIndex,
    monthKey,
  };
  const monthRedirectFields = {
    year,
    monthIndex,
  };

  const session = await auth();
  const monthName = new Date(Date.UTC(year, monthIndex, 1)).toLocaleString(
    "en-GB",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );

  const lastGwLabel =
    monthStatus.lastGwId != null ? `GW${monthStatus.lastGwId}` : "the last GW";

  const classicWinner = cMotm?.winners[0];
  const h2hWinner = hMotm?.winners[0];
  const classicCard = classicWinner
    ? classicMotmCardStats(classicWinner.entryId, classicMonthRows, finished.length)
    : null;
  const h2hCard = h2hWinner
    ? h2hMotmCardStats(h2hWinner.entryId, h2hMonthRows)
    : null;

  const csvRows = [
    ["track", "manager", "place", "amount"],
    ...(classicWinner
      ? [
          [
            "classic_motm",
            classicWinner.managerName,
            classicWinner.placeLabel,
            String(classicWinner.amountNgn),
          ],
        ]
      : []),
    ...(h2hWinner
      ? [
          [
            "h2h_motm",
            h2hWinner.managerName,
            h2hWinner.placeLabel,
            String(h2hWinner.amountNgn),
          ],
        ]
      : []),
    ...(monthlyReady
      ? [
          ...cMonth.winners.map((w) => [
            "classic_monthly",
            w.managerName,
            w.placeLabel,
            String(w.amountNgn),
          ]),
          ...hMonth.winners.map((w) => [
            "h2h_monthly",
            w.managerName,
            w.placeLabel,
            String(w.amountNgn),
          ]),
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">
            Monthly races
          </p>
          <h1 className="mt-2 font-display text-4xl text-white">{monthName}</h1>
          <p className="mt-2 text-white/60">
            MOTM and monthly table prizes unlock only after this month&apos;s last
            GW is played.{" "}
            <Link href="/rules" className="text-gold hover:underline">
              Algorithms →
            </Link>
            {session?.user ? (
              <>
                {" "}
                · Suspended managers are excluded from these races — manage on{" "}
                <Link
                  href="/admin/suspensions"
                  className="text-gold hover:underline"
                >
                  /admin/suspensions
                </Link>
                {" "}
                (FPL site leave alone is not enough).
              </>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-white/40">
            GWs in month: {monthGws.map((g) => g.id).join(", ") || "none yet"} ·
            finished: {finished.map((g) => g.id).join(", ") || "—"}
          </p>
        </div>
        <ShareExportBar
          captureId="motm-capture"
          csvFilename={`motm-${monthKey}.csv`}
          csvRows={csvRows}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {seasonMonths.map((m) => (
          <Link
            key={`${m.year}-${m.monthIndex}`}
            href={`/motm?year=${m.year}&month=${m.monthIndex}`}
            className={`rounded-md px-2.5 py-1 text-xs ${
              m.year === year && m.monthIndex === monthIndex
                ? "bg-gold text-ink"
                : "border border-white/15 text-white/60"
            }`}
          >
            {m.label}
          </Link>
        ))}
      </div>

      {params.msg ? (
        <AdminFlashBanner
          message={params.msg}
          ok={params.ok !== "0"}
        />
      ) : null}

      <div className="mt-6">
        <PrizeRulesLegend compact />
      </div>

      <div id="motm-capture" className="mt-8 space-y-10">
        <section>
          <h2 className="mb-4 font-display text-2xl text-white">
            Manager of the Month
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {!monthlyReady ? (
              <>
                <MotmLockedCard
                  track="Classic"
                  monthName={monthName}
                  lastGwLabel={lastGwLabel}
                  amountNgn={PRIZES.managerOfTheMonth.classic}
                />
                <MotmLockedCard
                  track="H2H"
                  monthName={monthName}
                  lastGwLabel={lastGwLabel}
                  amountNgn={PRIZES.managerOfTheMonth.h2h}
                />
              </>
            ) : (
              <>
                <div className="space-y-4">
                  {classicWinner && classicCard ? (
                    <MotmAwardCard
                      track="Classic"
                      monthName={monthName}
                      managerName={classicWinner.managerName}
                      teamName={classicWinner.teamName}
                      amountNgn={classicWinner.amountNgn}
                      badgeUrl={classicWinner.badgeUrl}
                      headline={classicCard.headline}
                      stats={classicCard.stats}
                      notes={classicWinner.notes ?? undefined}
                    />
                  ) : (
                    <MotmLockedCard
                      track="Classic"
                      monthName={monthName}
                      lastGwLabel={lastGwLabel}
                      amountNgn={PRIZES.managerOfTheMonth.classic}
                    />
                  )}
                  {cMotm ? (
                    <FraudCard
                      title="Classic fraud of the month"
                      fraud={cMotm.fraud}
                    />
                  ) : null}
                  {session?.user && classicWinner ? (
                    <AdminPayoutWorkflow
                      trackLabel={`Classic MOTM · ${monthName}`}
                      gameweek={monthKey}
                      category="motm_classic"
                      payouts={motmClassicPayouts}
                      confirmAction={confirmClassicMotmAndRedirect}
                      confirmHiddenFields={monthHidden}
                      markPaidAction={markMotmPaidAndRedirect}
                      markPaidHiddenFields={monthRedirectFields}
                    />
                  ) : null}
                </div>
                <div className="space-y-4">
                  {h2hWinner && h2hCard ? (
                    <MotmAwardCard
                      track="H2H"
                      monthName={monthName}
                      managerName={h2hWinner.managerName}
                      teamName={h2hWinner.teamName}
                      amountNgn={h2hWinner.amountNgn}
                      badgeUrl={h2hWinner.badgeUrl}
                      headline={h2hCard.headline}
                      stats={h2hCard.stats}
                      notes={h2hWinner.notes ?? undefined}
                    />
                  ) : (
                    <MotmLockedCard
                      track="H2H"
                      monthName={monthName}
                      lastGwLabel={lastGwLabel}
                      amountNgn={PRIZES.managerOfTheMonth.h2h}
                    />
                  )}
                  {hMotm ? (
                    <FraudCard title="H2H fraud of the month" fraud={hMotm.fraud} />
                  ) : null}
                  {session?.user && h2hWinner ? (
                    <AdminPayoutWorkflow
                      trackLabel={`H2H MOTM · ${monthName}`}
                      gameweek={monthKey}
                      category="motm_h2h"
                      payouts={motmH2hPayouts}
                      confirmAction={confirmH2hMotmAndRedirect}
                      confirmHiddenFields={monthHidden}
                      markPaidAction={markMotmPaidAndRedirect}
                      markPaidHiddenFields={monthRedirectFields}
                    />
                  ) : null}
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-2xl text-white">
            Monthly table (top 4)
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {!monthlyReady ? (
              <>
                <MonthlyLocked
                  title="Classic monthly table"
                  lastGwLabel={lastGwLabel}
                />
                <MonthlyLocked
                  title="H2H monthly table"
                  lastGwLabel={lastGwLabel}
                />
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <WinnersPreviewTable
                    title={`Classic · ${formatNgn(PRIZES.monthlyTable[0].amountNgn)}–${formatNgn(PRIZES.monthlyTable[3].amountNgn)}`}
                    winners={cMonth.winners}
                  />
                  {session?.user ? (
                    <AdminPayoutWorkflow
                      trackLabel={`Classic monthly table · ${monthName}`}
                      gameweek={monthKey}
                      category="classic_monthly"
                      payouts={classicMonthlyPayouts}
                      confirmAction={confirmClassicMonthlyAndRedirect}
                      confirmHiddenFields={{ ...monthHidden, throughGw }}
                      markPaidAction={markMotmPaidAndRedirect}
                      markPaidHiddenFields={monthRedirectFields}
                    />
                  ) : null}
                </div>
                <div className="space-y-4">
                  <WinnersPreviewTable
                    title={`H2H · ${formatNgn(PRIZES.monthlyTable[0].amountNgn)}–${formatNgn(PRIZES.monthlyTable[3].amountNgn)}`}
                    winners={hMonth.winners}
                  />
                  {session?.user ? (
                    <AdminPayoutWorkflow
                      trackLabel={`H2H monthly table · ${monthName}`}
                      gameweek={monthKey}
                      category="h2h_monthly"
                      payouts={h2hMonthlyPayouts}
                      confirmAction={confirmH2hMonthlyAndRedirect}
                      confirmHiddenFields={{ ...monthHidden, throughGw }}
                      markPaidAction={markMotmPaidAndRedirect}
                      markPaidHiddenFields={monthRedirectFields}
                    />
                  ) : null}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MonthlyLocked({
  title,
  lastGwLabel,
}: {
  title: string;
  lastGwLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/20 bg-panel/40 px-5 py-8">
      <p className="font-display text-xl text-white">{title}</p>
      <p className="mt-3 text-sm text-white/55">
        Not available until the last gameweek of this month (
        <span className="text-gold">{lastGwLabel}</span>) has been played.
      </p>
      <p className="mt-2 text-xs text-white/40">
        Monthly table ranks month-only stats (GW points or H2H match results from
        this month&apos;s gameweeks) with official FPL tie-breaks — not a live
        mid-month preview.
      </p>
    </div>
  );
}

function mapPayoutRows(
  rows: Array<{
    id: string;
    managerName: string;
    placeLabel: string;
    amountNgn: number;
    status: string;
    paidAt: Date | null;
  }>,
): PayoutWorkflowRow[] {
  return rows.map((p) => ({
    id: p.id,
    managerName: p.managerName,
    placeLabel: p.placeLabel,
    amountNgn: p.amountNgn,
    status: p.status,
    paidAt: p.paidAt,
  }));
}

function classicMotmCardStats(
  entryId: number,
  rows: ClassicMonthRow[],
  gwCount: number,
): { headline: string; stats: MotmStat[] } | null {
  const sorted = [...rows].sort(
    (a, b) =>
      b.monthPoints - a.monthPoints ||
      a.monthTransfers - b.monthTransfers,
  );
  const winner = sorted.find((r) => r.entryId === entryId);
  if (!winner) return null;
  const second = sorted.find((r) => r.entryId !== entryId);
  const clearance = second
    ? winner.monthPoints - second.monthPoints
    : winner.monthPoints;
  const avg =
    gwCount > 0 ? Math.round((winner.monthPoints / gwCount) * 10) / 10 : winner.monthPoints;

  const headline =
    clearance > 0
      ? `Cleared the field by ${clearance} ${CLASSIC_LABELS.monthPoints.toLowerCase()}`
      : `Joint top on ${CLASSIC_LABELS.monthPoints.toLowerCase()} — won on transfers`;

  return {
    headline,
    stats: [
      {
        label: CLASSIC_LABELS.monthPoints,
        value: String(winner.monthPoints),
        accent: true,
      },
      { label: "Avg / GW", value: String(avg) },
      { label: "GWs", value: String(gwCount) },
      {
        label: CLASSIC_LABELS.transfers,
        value: String(winner.monthTransfers),
      },
      {
        label: "Lead",
        value: clearance > 0 ? `+${clearance}` : "Tied",
      },
    ],
  };
}

function h2hMotmCardStats(
  entryId: number,
  rows: H2hMonthRow[],
): { headline: string; stats: MotmStat[] } | null {
  const sorted = [...rows].sort(
    (a, b) =>
      b.matchPts - a.matchPts ||
      b.ptsFor - a.ptsFor ||
      b.ptsDiff - a.ptsDiff ||
      a.ptsAgainst - b.ptsAgainst,
  );
  const winner = sorted.find((r) => r.entryId === entryId);
  if (!winner) return null;
  const second = sorted.find((r) => r.entryId !== entryId);
  const clearance = second ? winner.matchPts - second.matchPts : winner.matchPts;
  const played = winner.wins + winner.draws + winner.losses;

  const headline =
    clearance > 0
      ? `${winner.wins}W-${winner.draws}D-${winner.losses}L · ${clearance} ${H2H_LABELS.pts} clear`
      : `${winner.wins}W-${winner.draws}D-${winner.losses}L · edged it on ${H2H_LABELS.ptsFor}`;

  const diffLabel =
    winner.ptsDiff > 0
      ? `+${winner.ptsDiff}`
      : String(winner.ptsDiff);

  return {
    headline,
    stats: [
      {
        label: H2H_LABELS.h2hPts,
        value: String(winner.matchPts),
        accent: true,
      },
      {
        label: "Record",
        value: `${winner.wins}-${winner.draws}-${winner.losses}`,
      },
      { label: H2H_LABELS.ptsFor, value: String(winner.ptsFor) },
      { label: H2H_LABELS.ptsDiff, value: diffLabel },
      { label: H2H_LABELS.ptsAgainst, value: String(winner.ptsAgainst) },
      {
        label: "Played",
        value: String(played),
      },
    ],
  };
}
