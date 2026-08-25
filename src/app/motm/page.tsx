import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  confirmClassicMonthlyAction,
  confirmClassicMotmAction,
  confirmH2hMonthlyAction,
  confirmH2hMotmAction,
} from "@/lib/confirm-actions";
import { getBootstrapStatic, getSeasonMonths, isMonthFullyPlayed } from "@/lib/fpl/client";
import {
  resolveClassicMonthlyTable,
  resolveClassicMotm,
  resolveH2hMonthlyTable,
  resolveH2hMotm,
} from "@/lib/winners";
import { FraudCard, WinnersPreviewTable } from "@/components/WinnersPreview";
import { MotmAwardCard, MotmLockedCard } from "@/components/MotmAwardCard";
import { PrizeRulesLegend } from "@/components/PrizeRulesLegend";
import { ShareExportBar } from "@/components/ShareExportBar";
import { formatNgn, PRIZES } from "@/lib/league-config";
import type { ResolvedWinner } from "@/lib/winners";

export const dynamic = "force-dynamic";

export default async function MotmPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; msg?: string }>;
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

  if (monthlyReady) {
    [cMotm, hMotm, cMonth, hMonth] = await Promise.all([
      resolveClassicMotm(year, monthIndex),
      resolveH2hMotm(year, monthIndex),
      resolveClassicMonthlyTable(throughGw),
      resolveH2hMonthlyTable(throughGw),
    ]);
  }

  const session = await auth();
  const monthName = new Date(Date.UTC(year, monthIndex, 1)).toLocaleString(
    "en-GB",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );

  const lastGwLabel =
    monthStatus.lastGwId != null ? `GW${monthStatus.lastGwId}` : "the last GW";

  const classicWinner = cMotm?.winners[0];
  const h2hWinner = hMotm?.winners[0];

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
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          {params.msg}
        </p>
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
                  {classicWinner ? (
                    <MotmAwardCard
                      track="Classic"
                      monthName={monthName}
                      managerName={classicWinner.managerName}
                      teamName={classicWinner.teamName}
                      metricLabel={classicWinner.metricLabel}
                      metricValue={classicWinner.metricValue}
                      amountNgn={classicWinner.amountNgn}
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
                    <form
                      action={async (fd) => {
                        "use server";
                        fd.set("year", String(year));
                        fd.set("monthIndex", String(monthIndex));
                        fd.set("monthKey", String(monthKey));
                        const res = await confirmClassicMotmAction(fd);
                        redirect(
                          `/motm?year=${year}&month=${monthIndex}&msg=${encodeURIComponent(res.message)}`,
                        );
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg bg-united px-4 py-2 text-sm font-semibold text-white"
                      >
                        Confirm Classic MOTM
                      </button>
                    </form>
                  ) : null}
                </div>
                <div className="space-y-4">
                  {h2hWinner ? (
                    <MotmAwardCard
                      track="H2H"
                      monthName={monthName}
                      managerName={h2hWinner.managerName}
                      teamName={h2hWinner.teamName}
                      metricLabel={h2hWinner.metricLabel}
                      metricValue={h2hWinner.metricValue}
                      amountNgn={h2hWinner.amountNgn}
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
                    <form
                      action={async (fd) => {
                        "use server";
                        fd.set("year", String(year));
                        fd.set("monthIndex", String(monthIndex));
                        fd.set("monthKey", String(monthKey));
                        const res = await confirmH2hMotmAction(fd);
                        redirect(
                          `/motm?year=${year}&month=${monthIndex}&msg=${encodeURIComponent(res.message)}`,
                        );
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg bg-united px-4 py-2 text-sm font-semibold text-white"
                      >
                        Confirm H2H MOTM
                      </button>
                    </form>
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
                    <form
                      action={async (fd) => {
                        "use server";
                        fd.set("year", String(year));
                        fd.set("monthIndex", String(monthIndex));
                        fd.set("throughGw", String(throughGw));
                        fd.set("monthKey", String(monthKey));
                        const res = await confirmClassicMonthlyAction(fd);
                        redirect(
                          `/motm?year=${year}&month=${monthIndex}&msg=${encodeURIComponent(res.message)}`,
                        );
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg border border-gold/40 px-4 py-2 text-sm font-semibold text-gold"
                      >
                        Confirm Classic monthly table
                      </button>
                    </form>
                  ) : null}
                </div>
                <div className="space-y-4">
                  <WinnersPreviewTable
                    title={`H2H · ${formatNgn(PRIZES.monthlyTable[0].amountNgn)}–${formatNgn(PRIZES.monthlyTable[3].amountNgn)}`}
                    winners={hMonth.winners}
                  />
                  {session?.user ? (
                    <form
                      action={async (fd) => {
                        "use server";
                        fd.set("year", String(year));
                        fd.set("monthIndex", String(monthIndex));
                        fd.set("throughGw", String(throughGw));
                        fd.set("monthKey", String(monthKey));
                        const res = await confirmH2hMonthlyAction(fd);
                        redirect(
                          `/motm?year=${year}&month=${monthIndex}&msg=${encodeURIComponent(res.message)}`,
                        );
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg border border-gold/40 px-4 py-2 text-sm font-semibold text-gold"
                      >
                        Confirm H2H monthly table
                      </button>
                    </form>
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
        Monthly table cash uses the season standings snapshot once the month is
        complete — not a live mid-month preview.
      </p>
    </div>
  );
}
