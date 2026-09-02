import { unstable_cache } from "next/cache";
import {
  getAllClassicStandings,
  getAllH2hStandings,
  getEntryHistory,
  getFinishedGameweeks,
  getH2hMatchesForEvent,
  getSeasonMonths,
  isMonthFullyPlayed,
} from "@/lib/fpl/client";
import type { EntryHistory } from "@/lib/fpl/types";
import { chipExcludedGameweeks } from "@/lib/fpl-tiebreaks";
import { LEAGUE, PRIZES } from "@/lib/league-config";
import {
  filterOutSuspended,
  getSuspendedEntryIds,
} from "@/lib/suspensions";
import {
  applyTransferTieBreakAndPrizes,
  pickFraud,
  type Candidate,
  type ResolvedWinner,
} from "@/lib/winners";

export type ManagerSeasonStats = {
  entryId: number;
  managerName: string;
  teamName: string;
  classicMotw: number;
  h2hMotw: number;
  classicPodium: number;
  h2hPodium: number;
  classicTop4: number;
  motmClassic: number;
  motmH2h: number;
  fraudWeekClassic: number;
  fraudWeekH2h: number;
  fraudMonthClassic: number;
  fraudMonthH2h: number;
};

export type SeasonStatsPayload = {
  finishedGwCount: number;
  completedMonthCount: number;
  managers: ManagerSeasonStats[];
};

type EntryMeta = { entryId: number; managerName: string; teamName: string };

type HistoryMaps = {
  pointsByGw: Map<number, number>;
  transfersThroughGw: Map<number, number>;
};

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return out;
}

function buildHistoryMaps(history: EntryHistory): HistoryMaps {
  const pointsByGw = new Map<number, number>();
  const transfersThroughGw = new Map<number, number>();
  const excluded = chipExcludedGameweeks(history.chips);
  let runningTransfers = 0;
  const rows = [...history.current].sort((a, b) => a.event - b.event);
  for (const row of rows) {
    pointsByGw.set(row.event, row.points ?? 0);
    if (!excluded.has(row.event)) {
      runningTransfers += row.event_transfers ?? 0;
    }
    transfersThroughGw.set(row.event, runningTransfers);
  }
  return { pointsByGw, transfersThroughGw };
}

function transfersInGameweeks(
  history: EntryHistory | undefined,
  gwIds: number[],
): number {
  if (!history || gwIds.length === 0) return 0;
  const excluded = chipExcludedGameweeks(history.chips);
  const set = new Set(gwIds);
  return history.current
    .filter((row) => set.has(row.event) && !excluded.has(row.event))
    .reduce((sum, row) => sum + (row.event_transfers ?? 0), 0);
}

function transfersAt(
  maps: HistoryMaps | undefined,
  gw: number,
): number {
  if (!maps) return 0;
  if (maps.transfersThroughGw.has(gw)) {
    return maps.transfersThroughGw.get(gw)!;
  }
  let best = 0;
  for (const [event, tr] of maps.transfersThroughGw) {
    if (event <= gw && tr >= best) best = tr;
  }
  return best;
}

function emptyStats(meta: EntryMeta): ManagerSeasonStats {
  return {
    entryId: meta.entryId,
    managerName: meta.managerName,
    teamName: meta.teamName,
    classicMotw: 0,
    h2hMotw: 0,
    classicPodium: 0,
    h2hPodium: 0,
    classicTop4: 0,
    motmClassic: 0,
    motmH2h: 0,
    fraudWeekClassic: 0,
    fraudWeekH2h: 0,
    fraudMonthClassic: 0,
    fraudMonthH2h: 0,
  };
}

function bump(
  bag: Map<number, ManagerSeasonStats>,
  meta: EntryMeta,
  field: keyof Omit<ManagerSeasonStats, "entryId" | "managerName" | "teamName">,
) {
  const cur = bag.get(meta.entryId) ?? emptyStats(meta);
  cur.managerName = meta.managerName;
  cur.teamName = meta.teamName;
  cur[field] += 1;
  bag.set(meta.entryId, cur);
}

function tallyWinners(
  bag: Map<number, ManagerSeasonStats>,
  winners: ResolvedWinner[],
  fields: {
    first?: keyof Omit<ManagerSeasonStats, "entryId" | "managerName" | "teamName">;
    podium?: keyof Omit<ManagerSeasonStats, "entryId" | "managerName" | "teamName">;
    top4?: keyof Omit<ManagerSeasonStats, "entryId" | "managerName" | "teamName">;
  },
) {
  for (const w of winners) {
    const meta = {
      entryId: w.entryId,
      managerName: w.managerName,
      teamName: w.teamName,
    };
    if (fields.first && w.place === 1) bump(bag, meta, fields.first);
    if (fields.podium && w.place >= 1 && w.place <= 3) bump(bag, meta, fields.podium);
    if (fields.top4 && w.place >= 1 && w.place <= 4) bump(bag, meta, fields.top4);
  }
}

function tallyFraud(
  bag: Map<number, ManagerSeasonStats>,
  fraud: Array<{ entryId: number; managerName: string; teamName: string }>,
  field: keyof Omit<ManagerSeasonStats, "entryId" | "managerName" | "teamName">,
) {
  for (const f of fraud) {
    bump(
      bag,
      { entryId: f.entryId, managerName: f.managerName, teamName: f.teamName },
      field,
    );
  }
}

function h2hRowsFromMatches(
  matches: Awaited<ReturnType<typeof getH2hMatchesForEvent>>,
  suspended: Set<number>,
  gw: number,
  historyByEntry: Map<number, HistoryMaps>,
): { winners: Candidate[]; losers: Candidate[] } {
  const winnerRows: Omit<Candidate, "transfersUsed">[] = [];
  const loserRows: Omit<Candidate, "transfersUsed">[] = [];

  for (const m of matches) {
    if (m.is_bye) continue;
    const p1 = m.entry_1_points ?? 0;
    const p2 = m.entry_2_points ?? 0;
    if (!m.entry_1_entry || !m.entry_2_entry) continue;
    if (p1 === p2) continue;

    if (p1 > p2) {
      if (!suspended.has(m.entry_1_entry)) {
        winnerRows.push({
          entryId: m.entry_1_entry,
          managerName: m.entry_1_player_name ?? "Unknown",
          teamName: m.entry_1_name ?? "",
          sortPrimary: p1 - p2,
          metricLabel: "Win margin",
          metricValue: p1 - p2,
        });
      }
      if (!suspended.has(m.entry_2_entry)) {
        loserRows.push({
          entryId: m.entry_2_entry,
          managerName: m.entry_2_player_name ?? "Unknown",
          teamName: m.entry_2_name ?? "",
          sortPrimary: p2 - p1,
          metricLabel: "Loss margin",
          metricValue: p2 - p1,
        });
      }
    } else {
      if (!suspended.has(m.entry_2_entry)) {
        winnerRows.push({
          entryId: m.entry_2_entry,
          managerName: m.entry_2_player_name ?? "Unknown",
          teamName: m.entry_2_name ?? "",
          sortPrimary: p2 - p1,
          metricLabel: "Win margin",
          metricValue: p2 - p1,
        });
      }
      if (!suspended.has(m.entry_1_entry)) {
        loserRows.push({
          entryId: m.entry_1_entry,
          managerName: m.entry_1_player_name ?? "Unknown",
          teamName: m.entry_1_name ?? "",
          sortPrimary: p1 - p2,
          metricLabel: "Loss margin",
          metricValue: p1 - p2,
        });
      }
    }
  }

  const withTr = (rows: Omit<Candidate, "transfersUsed">[]): Candidate[] =>
    rows.map((r) => ({
      ...r,
      transfersUsed: transfersAt(historyByEntry.get(r.entryId), gw),
    }));

  return { winners: withTr(winnerRows), losers: withTr(loserRows) };
}

async function computeSeasonStats(): Promise<SeasonStatsPayload> {
  const [finishedGws, classicRaw, h2hRaw, suspendedClassic, suspendedH2h, months] =
    await Promise.all([
      getFinishedGameweeks(),
      getAllClassicStandings(LEAGUE.classic.leagueId),
      getAllH2hStandings(LEAGUE.h2h.leagueId),
      getSuspendedEntryIds("classic"),
      getSuspendedEntryIds("h2h"),
      getSeasonMonths(),
    ]);

  const classicEntries = filterOutSuspended(classicRaw.results, suspendedClassic).map(
    (r) => ({
      entryId: r.entry,
      managerName: r.player_name,
      teamName: r.entry_name,
    }),
  );
  const h2hEntries = filterOutSuspended(h2hRaw.results, suspendedH2h).map((r) => ({
    entryId: r.entry,
    managerName: r.player_name,
    teamName: r.entry_name,
  }));

  const metaByEntry = new Map<number, EntryMeta>();
  for (const e of [...classicEntries, ...h2hEntries]) {
    metaByEntry.set(e.entryId, e);
  }

  const historyByEntry = new Map<number, HistoryMaps>();
  const rawHistoryByEntry = new Map<number, EntryHistory>();
  const entryIds = [...metaByEntry.keys()];
  await mapPool(entryIds, 8, async (entryId) => {
    try {
      const history = await getEntryHistory(entryId);
      rawHistoryByEntry.set(entryId, history);
      historyByEntry.set(entryId, buildHistoryMaps(history));
    } catch {
      historyByEntry.set(entryId, {
        pointsByGw: new Map(),
        transfersThroughGw: new Map(),
      });
    }
  });

  const bag = new Map<number, ManagerSeasonStats>();
  for (const meta of metaByEntry.values()) {
    bag.set(meta.entryId, emptyStats(meta));
  }

  const finishedIds = finishedGws.map((g) => g.id);

  // Classic weekly from histories
  for (const gw of finishedIds) {
    const candidates: Candidate[] = classicEntries.map((e) => {
      const maps = historyByEntry.get(e.entryId);
      const pts = maps?.pointsByGw.get(gw) ?? 0;
      return {
        entryId: e.entryId,
        managerName: e.managerName,
        teamName: e.teamName,
        sortPrimary: pts,
        metricLabel: "GW points",
        metricValue: pts,
        transfersUsed: transfersAt(maps, gw),
      };
    });
    if (candidates.every((c) => c.sortPrimary === 0)) continue;

    const winners = applyTransferTieBreakAndPrizes(candidates, PRIZES.weekly);
    const fraud = pickFraud(candidates, "Certified brick — lowest GW haul");
    tallyWinners(bag, winners, {
      first: "classicMotw",
      podium: "classicPodium",
      top4: "classicTop4",
    });
    tallyFraud(bag, fraud, "fraudWeekClassic");
  }

  // H2H weekly from matches
  const matchPages = await mapPool(finishedIds, 4, async (gw) => ({
    gw,
    matches: await getH2hMatchesForEvent(LEAGUE.h2h.leagueId, gw),
  }));

  for (const { gw, matches } of matchPages) {
    const { winners: winC, losers: loseC } = h2hRowsFromMatches(
      matches,
      suspendedH2h,
      gw,
      historyByEntry,
    );
    if (winC.length === 0) continue;
    const winners = applyTransferTieBreakAndPrizes(winC, PRIZES.weekly);
    const fraud = pickFraud(loseC, "Got cooked — worst H2H loss margin");
    tallyWinners(bag, winners, {
      first: "h2hMotw",
      podium: "h2hPodium",
    });
    tallyFraud(bag, fraud, "fraudWeekH2h");
  }

  // Completed months → MOTM
  let completedMonthCount = 0;
  for (const m of months) {
    const status = await isMonthFullyPlayed(m.year, m.monthIndex);
    if (!status.ready) continue;
    completedMonthCount += 1;
    const ids = status.finished.map((g) => g.id);

    const classicCandidates: Candidate[] = classicEntries.map((e) => {
      const maps = historyByEntry.get(e.entryId);
      const pts = ids.reduce((sum, gw) => sum + (maps?.pointsByGw.get(gw) ?? 0), 0);
      return {
        entryId: e.entryId,
        managerName: e.managerName,
        teamName: e.teamName,
        sortPrimary: pts,
        metricLabel: "Month points",
        metricValue: pts,
        transfersUsed: transfersInGameweeks(
          rawHistoryByEntry.get(e.entryId),
          ids,
        ),
      };
    });
    if (!classicCandidates.every((c) => c.sortPrimary === 0)) {
      const motmPrize = [
        { place: 1, amountNgn: PRIZES.managerOfTheMonth.classic },
      ] as const;
      const winners = applyTransferTieBreakAndPrizes(classicCandidates, motmPrize);
      const fraud = pickFraud(
        classicCandidates,
        "Fraud of the Month — coldest Classic month",
      );
      tallyWinners(bag, winners, { first: "motmClassic" });
      tallyFraud(bag, fraud, "fraudMonthClassic");
    }

    const h2hStats = new Map<
      number,
      {
        entryId: number;
        managerName: string;
        teamName: string;
        matchPts: number;
        ptsFor: number;
        ptsAgainst: number;
      }
    >();
    const bumpH2h = (
      entryId: number,
      managerName: string,
      teamName: string,
      matchPts: number,
      ptsFor: number,
      ptsAgainst: number,
    ) => {
      if (suspendedH2h.has(entryId)) return;
      const cur = h2hStats.get(entryId) ?? {
        entryId,
        managerName,
        teamName,
        matchPts: 0,
        ptsFor: 0,
        ptsAgainst: 0,
      };
      cur.matchPts += matchPts;
      cur.ptsFor += ptsFor;
      cur.ptsAgainst += ptsAgainst;
      cur.managerName = managerName;
      cur.teamName = teamName;
      h2hStats.set(entryId, cur);
    };

    for (const { gw, matches } of matchPages) {
      if (!ids.includes(gw)) continue;
      for (const match of matches) {
        if (match.is_bye || !match.entry_1_entry || !match.entry_2_entry) continue;
        const p1 = match.entry_1_points ?? 0;
        const p2 = match.entry_2_points ?? 0;
        let pts1 = 1;
        let pts2 = 1;
        if (p1 > p2) {
          pts1 = 3;
          pts2 = 0;
        } else if (p2 > p1) {
          pts1 = 0;
          pts2 = 3;
        }
        bumpH2h(
          match.entry_1_entry,
          match.entry_1_player_name ?? "Unknown",
          match.entry_1_name ?? "",
          pts1,
          p1,
          p2,
        );
        bumpH2h(
          match.entry_2_entry,
          match.entry_2_player_name ?? "Unknown",
          match.entry_2_name ?? "",
          pts2,
          p2,
          p1,
        );
      }
    }

    const h2hCandidates: Candidate[] = [...h2hStats.values()].map((s) => ({
      entryId: s.entryId,
      managerName: s.managerName,
      teamName: s.teamName,
      sortPrimary: s.matchPts,
      sortSecondary: s.ptsFor,
      sortTertiary: s.ptsFor - s.ptsAgainst,
      sortQuaternary: -s.ptsAgainst,
      metricLabel: "H2H pts",
      metricValue: s.matchPts,
      transfersUsed: 0,
    }));
    if (h2hCandidates.length > 0) {
      const motmPrize = [
        { place: 1, amountNgn: PRIZES.managerOfTheMonth.h2h },
      ] as const;
      const winners = applyTransferTieBreakAndPrizes(h2hCandidates, motmPrize);
      const fraud = pickFraud(
        h2hCandidates,
        "Fraud of the Month — H2H nightmare fuel",
      );
      tallyWinners(bag, winners, { first: "motmH2h" });
      tallyFraud(bag, fraud, "fraudMonthH2h");
    }
  }

  return {
    finishedGwCount: finishedIds.length,
    completedMonthCount,
    managers: [...bag.values()].sort((a, b) =>
      a.managerName.localeCompare(b.managerName),
    ),
  };
}

export const getSeasonStats = unstable_cache(
  computeSeasonStats,
  ["season-glory-stats"],
  { revalidate: 900 },
);

export type StatLeaderboard = {
  key: string;
  title: string;
  blurb: string;
  rows: Array<{
    entryId: number;
    managerName: string;
    teamName: string;
    count: number;
  }>;
};

export function buildSeasonLeaderboards(
  managers: ManagerSeasonStats[],
  limit = 10,
): StatLeaderboard[] {
  const board = (
    key: string,
    title: string,
    blurb: string,
    field: keyof Omit<ManagerSeasonStats, "entryId" | "managerName" | "teamName">,
  ): StatLeaderboard => ({
    key,
    title,
    blurb,
    rows: [...managers]
      .filter((m) => m[field] > 0)
      .sort((a, b) => b[field] - a[field] || a.managerName.localeCompare(b.managerName))
      .slice(0, limit)
      .map((m) => ({
        entryId: m.entryId,
        managerName: m.managerName,
        teamName: m.teamName,
        count: m[field],
      })),
  });

  return [
    board("classicMotw", "Classic MOTW", "1st place Classic weekly (incl. splits)", "classicMotw"),
    board("h2hMotw", "H2H MOTW", "1st place H2H weekly (incl. splits)", "h2hMotw"),
    board("classicPodium", "Classic podium", "Classic weekly places 1–3", "classicPodium"),
    board("h2hPodium", "H2H podium", "H2H weekly places 1–3", "h2hPodium"),
    board("classicTop4", "Classic top 4", "Classic weekly places 1–4", "classicTop4"),
    board("motmClassic", "MOTM Classic", "Classic Manager of the Month wins", "motmClassic"),
    board("motmH2h", "MOTM H2H", "H2H Manager of the Month wins", "motmH2h"),
    board(
      "fraudWeekClassic",
      "Fraud of the week · Classic",
      "Lowest Classic GW haul",
      "fraudWeekClassic",
    ),
    board(
      "fraudWeekH2h",
      "Fraud of the week · H2H",
      "Worst H2H loss margin",
      "fraudWeekH2h",
    ),
    board(
      "fraudMonthClassic",
      "Fraud of the month · Classic",
      "Coldest Classic month",
      "fraudMonthClassic",
    ),
    board(
      "fraudMonthH2h",
      "Fraud of the month · H2H",
      "Worst H2H month",
      "fraudMonthH2h",
    ),
  ];
}
