import {
  getAllClassicStandings,
  getAllH2hStandings,
  getCurrentGameweek,
  getEntryBadgeUrl,
  getGwPoints,
  getH2hMatchesForEvent,
} from "@/lib/fpl/client";
import { CLASSIC_LABELS, H2H_LABELS } from "@/lib/fpl-labels";
import {
  applyFplPrizes,
  classicSortKeys,
  getFplTransferCount,
  getFplTransferCountThroughGw,
  h2hSortKeys,
  pickFplFraud,
  type FplCandidate,
  type ResolvedFplWinner,
} from "@/lib/fpl-tiebreaks";
import {
  getClassicMonthStats,
  getH2hMonthStats,
} from "@/lib/month-stats";
import {
  LEAGUE,
  PRIZES,
  formatNgn,
  ordinal,
  type PayoutCategory,
} from "@/lib/league-config";
import {
  filterOutSuspended,
  getSuspendedEntryIds,
} from "@/lib/suspensions";

export type ResolvedWinner = ResolvedFplWinner & { badgeUrl?: string | null };

export type FraudResult = {
  entryId: number;
  managerName: string;
  teamName: string;
  transfersUsed: number;
  metricLabel: string;
  metricValue: number;
  roast: string;
  badgeUrl?: string | null;
};

/** @deprecated Use FplCandidate from fpl-tiebreaks */
export type Candidate = {
  entryId: number;
  managerName: string;
  teamName: string;
  sortPrimary: number;
  sortSecondary?: number;
  sortTertiary?: number;
  sortQuaternary?: number;
  transfersUsed: number;
  metricLabel: string;
  metricValue: number;
};

async function attachBadgeUrls<T extends { entryId: number }>(
  items: T[],
): Promise<(T & { badgeUrl: string | null })[]> {
  const uniqueIds = [...new Set(items.map((i) => i.entryId))];
  const badges = new Map<number, string | null>();
  await Promise.all(
    uniqueIds.map(async (id) => {
      badges.set(id, await getEntryBadgeUrl(id));
    }),
  );
  return items.map((item) => ({
    ...item,
    badgeUrl: badges.get(item.entryId) ?? null,
  }));
}

/** Back-compat wrapper for season-stats and other callers. */
export function applyTransferTieBreakAndPrizes(
  candidates: Candidate[],
  prizes: readonly { place: number; amountNgn: number }[],
): ResolvedWinner[] {
  const mapped: FplCandidate[] = candidates.map((c) => ({
    entryId: c.entryId,
    managerName: c.managerName,
    teamName: c.teamName,
    transfersUsed: c.transfersUsed,
    metricLabel: c.metricLabel,
    metricValue: c.metricValue,
    sortKeys: [
      c.sortPrimary,
      c.sortSecondary ?? 0,
      c.sortTertiary ?? 0,
      c.sortQuaternary ?? -c.transfersUsed,
    ],
  }));
  return applyFplPrizes(mapped, prizes);
}

export function pickFraud(
  candidates: Candidate[],
  roast: string,
): FraudResult[] {
  const mapped: FplCandidate[] = candidates.map((c) => ({
    entryId: c.entryId,
    managerName: c.managerName,
    teamName: c.teamName,
    transfersUsed: c.transfersUsed,
    metricLabel: c.metricLabel,
    metricValue: c.metricValue,
    sortKeys: [
      c.sortPrimary,
      c.sortSecondary ?? 0,
      c.sortTertiary ?? 0,
      c.sortQuaternary ?? 0,
    ],
  }));
  return pickFplFraud(mapped, roast);
}

function classicCandidate(
  row: {
    entryId: number;
    managerName: string;
    teamName: string;
    points: number;
    transfers: number;
  },
  metricLabel: string,
): FplCandidate {
  return {
    entryId: row.entryId,
    managerName: row.managerName,
    teamName: row.teamName,
    transfersUsed: row.transfers,
    metricLabel,
    metricValue: row.points,
    sortKeys: classicSortKeys(row.points, row.transfers),
  };
}

function h2hCandidate(
  row: {
    entryId: number;
    managerName: string;
    teamName: string;
    pts: number;
    ptsFor: number;
    ptsDiff: number;
    ptsAgainst: number;
  },
  metricLabel: string,
): FplCandidate {
  return {
    entryId: row.entryId,
    managerName: row.managerName,
    teamName: row.teamName,
    transfersUsed: 0,
    metricLabel,
    metricValue: row.pts,
    sortKeys: h2hSortKeys(row.pts, row.ptsFor, row.ptsDiff, row.ptsAgainst),
  };
}

/** Classic weekly: top GW points that week. */
export async function resolveClassicWeekly(gw: number): Promise<{
  winners: ResolvedWinner[];
  fraud: FraudResult[];
  category: PayoutCategory;
  emptyReason: string | null;
}> {
  const current = await getCurrentGameweek();
  const currentId = current?.id ?? 1;

  if (gw > currentId) {
    return {
      category: "classic_weekly",
      winners: [],
      fraud: [],
      emptyReason: `GW${gw} hasn’t started yet.`,
    };
  }

  const { results: raw } = await getAllClassicStandings(LEAGUE.classic.leagueId);
  const suspended = await getSuspendedEntryIds("classic");
  const results = filterOutSuspended(raw, suspended);

  const useLive = gw === currentId && !(current?.finished ?? false);

  const rows = await Promise.all(
    results.map(async (r) => {
      let pts = 0;
      try {
        pts = await getGwPoints(r.entry, gw);
      } catch {
        pts = 0;
      }
      if (pts === 0 && useLive && r.event_total > 0) {
        pts = r.event_total;
      }
      const transfers = await getFplTransferCount(r.entry, [gw]);
      return classicCandidate(
        {
          entryId: r.entry,
          managerName: r.player_name,
          teamName: r.entry_name,
          points: pts,
          transfers,
        },
        CLASSIC_LABELS.gwPoints,
      );
    }),
  );

  if (rows.every((r) => r.metricValue === 0)) {
    return {
      category: "classic_weekly",
      winners: [],
      fraud: [],
      emptyReason: useLive
        ? "No GW scores yet — check back after the deadline."
        : `No Classic scores recorded for GW${gw}.`,
    };
  }

  const [winners, fraud] = await Promise.all([
    attachBadgeUrls(applyFplPrizes(rows, PRIZES.weekly)),
    attachBadgeUrls(
      pickFplFraud(rows, "Certified brick — lowest GW haul"),
    ),
  ]);
  return {
    category: "classic_weekly",
    winners,
    fraud,
    emptyReason: null,
  };
}

/** H2H weekly: must win, then best margin, then transfers. */
export async function resolveH2hWeekly(gw: number): Promise<{
  winners: ResolvedWinner[];
  fraud: FraudResult[];
  category: PayoutCategory;
  emptyReason: string | null;
}> {
  const current = await getCurrentGameweek();
  const currentId = current?.id ?? 1;
  if (gw > currentId) {
    return {
      category: "h2h_weekly",
      winners: [],
      fraud: [],
      emptyReason: `GW${gw} hasn’t started yet.`,
    };
  }

  const suspended = await getSuspendedEntryIds("h2h");
  const matches = await getH2hMatchesForEvent(LEAGUE.h2h.leagueId, gw);
  const winnerRows: FplCandidate[] = [];
  const loserRows: FplCandidate[] = [];

  for (const m of matches) {
    if (m.is_bye) continue;
    const p1 = m.entry_1_points ?? 0;
    const p2 = m.entry_2_points ?? 0;
    if (!m.entry_1_entry || !m.entry_2_entry) continue;
    if (p1 === p2) continue;

    const addWinner = async (
      entryId: number,
      managerName: string,
      teamName: string,
      margin: number,
    ) => {
      const transfers = await getFplTransferCount(entryId, [gw]);
      winnerRows.push({
        entryId,
        managerName,
        teamName,
        transfersUsed: transfers,
        metricLabel: H2H_LABELS.winMargin,
        metricValue: margin,
        sortKeys: [margin, -transfers],
      });
    };

    const addLoser = async (
      entryId: number,
      managerName: string,
      teamName: string,
      margin: number,
    ) => {
      const transfers = await getFplTransferCount(entryId, [gw]);
      loserRows.push({
        entryId,
        managerName,
        teamName,
        transfersUsed: transfers,
        metricLabel: H2H_LABELS.lossMargin,
        metricValue: margin,
        sortKeys: [margin, -transfers],
      });
    };

    if (p1 > p2) {
      if (!suspended.has(m.entry_1_entry)) {
        await addWinner(
          m.entry_1_entry,
          m.entry_1_player_name ?? "Unknown",
          m.entry_1_name ?? "",
          p1 - p2,
        );
      }
      if (!suspended.has(m.entry_2_entry)) {
        await addLoser(
          m.entry_2_entry,
          m.entry_2_player_name ?? "Unknown",
          m.entry_2_name ?? "",
          p2 - p1,
        );
      }
    } else {
      if (!suspended.has(m.entry_2_entry)) {
        await addWinner(
          m.entry_2_entry,
          m.entry_2_player_name ?? "Unknown",
          m.entry_2_name ?? "",
          p2 - p1,
        );
      }
      if (!suspended.has(m.entry_1_entry)) {
        await addLoser(
          m.entry_1_entry,
          m.entry_1_player_name ?? "Unknown",
          m.entry_1_name ?? "",
          p1 - p2,
        );
      }
    }
  }

  if (winnerRows.length === 0) {
    return {
      category: "h2h_weekly",
      winners: [],
      fraud: [],
      emptyReason:
        gw === currentId
          ? "No finished H2H wins yet this GW."
          : `No H2H win results for GW${gw}.`,
    };
  }

  const [winners, fraud] = await Promise.all([
    attachBadgeUrls(applyFplPrizes(winnerRows, PRIZES.weekly)),
    attachBadgeUrls(
      pickFplFraud(loserRows, "Got cooked — worst H2H loss margin"),
    ),
  ]);
  return {
    category: "h2h_weekly",
    winners,
    fraud,
    emptyReason: null,
  };
}

/** Monthly table: month-only GW points, FPL Classic tie-break. */
export async function resolveClassicMonthlyTable(
  year: number,
  monthIndex: number,
): Promise<{ winners: ResolvedWinner[]; category: PayoutCategory }> {
  const { rows } = await getClassicMonthStats(year, monthIndex);
  const candidates = rows.map((r) =>
    classicCandidate(
      {
        entryId: r.entryId,
        managerName: r.managerName,
        teamName: r.teamName,
        points: r.monthPoints,
        transfers: r.monthTransfers,
      },
      CLASSIC_LABELS.monthPoints,
    ),
  );
  return {
    category: "classic_monthly",
    winners: applyFplPrizes(candidates, PRIZES.monthlyTable),
  };
}

/** Monthly table: month-only H2H stats, FPL H2H tie-break. */
export async function resolveH2hMonthlyTable(
  year: number,
  monthIndex: number,
): Promise<{ winners: ResolvedWinner[]; category: PayoutCategory }> {
  const { rows } = await getH2hMonthStats(year, monthIndex);
  const candidates = rows.map((r) =>
    h2hCandidate(
      {
        entryId: r.entryId,
        managerName: r.managerName,
        teamName: r.teamName,
        pts: r.matchPts,
        ptsFor: r.ptsFor,
        ptsDiff: r.ptsDiff,
        ptsAgainst: r.ptsAgainst,
      },
      H2H_LABELS.h2hPts,
    ),
  );
  return {
    category: "h2h_monthly",
    winners: applyFplPrizes(candidates, PRIZES.monthlyTable),
  };
}

/** Classic MOTM: same month stats as monthly table; pays 1st only. */
export async function resolveClassicMotm(
  year: number,
  monthIndex: number,
): Promise<{
  winners: ResolvedWinner[];
  fraud: FraudResult[];
  category: PayoutCategory;
  gameweekIds: number[];
}> {
  const { gameweekIds, rows } = await getClassicMonthStats(year, monthIndex);
  const candidates = rows.map((r) =>
    classicCandidate(
      {
        entryId: r.entryId,
        managerName: r.managerName,
        teamName: r.teamName,
        points: r.monthPoints,
        transfers: r.monthTransfers,
      },
      CLASSIC_LABELS.monthPoints,
    ),
  );
  const motmPrize = [
    { place: 1, amountNgn: PRIZES.managerOfTheMonth.classic },
  ] as const;

  return {
    category: "motm_classic",
    gameweekIds,
    winners: await attachBadgeUrls(applyFplPrizes(candidates, motmPrize)),
    fraud: await attachBadgeUrls(
      pickFplFraud(
        candidates,
        "Fraud of the Month — coldest Classic month",
      ),
    ),
  };
}

/** H2H MOTM: same month stats as monthly table; pays 1st only. */
export async function resolveH2hMotm(
  year: number,
  monthIndex: number,
): Promise<{
  winners: ResolvedWinner[];
  fraud: FraudResult[];
  category: PayoutCategory;
  gameweekIds: number[];
}> {
  const { gameweekIds, rows } = await getH2hMonthStats(year, monthIndex);
  const candidates = rows.map((r) =>
    h2hCandidate(
      {
        entryId: r.entryId,
        managerName: r.managerName,
        teamName: r.teamName,
        pts: r.matchPts,
        ptsFor: r.ptsFor,
        ptsDiff: r.ptsDiff,
        ptsAgainst: r.ptsAgainst,
      },
      H2H_LABELS.h2hPts,
    ),
  );
  const motmPrize = [
    { place: 1, amountNgn: PRIZES.managerOfTheMonth.h2h },
  ] as const;

  return {
    category: "motm_h2h",
    gameweekIds,
    winners: await attachBadgeUrls(applyFplPrizes(candidates, motmPrize)),
    fraud: await attachBadgeUrls(
      pickFplFraud(
        candidates,
        "Fraud of the Month — H2H nightmare fuel",
      ),
    ),
  };
}

export async function resolveH2hMonthlyFraud(
  year: number,
  monthIndex: number,
): Promise<FraudResult[]> {
  const { fraud } = await resolveH2hMotm(year, monthIndex);
  return fraud;
}

/** Classic EOS: season Points → FPL transfers → split top 4. */
export async function resolveClassicEos(
  throughGw: number,
): Promise<{ winners: ResolvedWinner[]; category: PayoutCategory }> {
  const { results: raw } = await getAllClassicStandings(LEAGUE.classic.leagueId);
  const suspended = await getSuspendedEntryIds("classic");
  const results = filterOutSuspended(raw, suspended);

  const candidates = await Promise.all(
    results.map(async (r) => {
      const transfers = await getFplTransferCountThroughGw(r.entry, throughGw);
      return classicCandidate(
        {
          entryId: r.entry,
          managerName: r.player_name,
          teamName: r.entry_name,
          points: r.total,
          transfers,
        },
        CLASSIC_LABELS.points,
      );
    }),
  );

  return {
    category: "classic_eos",
    winners: applyFplPrizes(candidates, PRIZES.endOfSeason),
  };
}
export async function resolveH2hEos(
  throughGw: number,
): Promise<{ winners: ResolvedWinner[]; category: PayoutCategory }> {
  const { results: raw } = await getAllH2hStandings(
    LEAGUE.h2h.leagueId,
    throughGw,
  );
  const suspended = await getSuspendedEntryIds("h2h");
  const results = filterOutSuspended(raw, suspended);

  const candidates = results.map((r) =>
    h2hCandidate(
      {
        entryId: r.entry,
        managerName: r.player_name,
        teamName: r.entry_name,
        pts: r.total,
        ptsFor: r.points_for,
        ptsDiff: r.points_for - (r.points_against ?? 0),
        ptsAgainst: r.points_against ?? 0,
      },
      H2H_LABELS.h2hPts,
    ),
  );

  return {
    category: "h2h_eos",
    winners: applyFplPrizes(candidates, PRIZES.endOfSeason),
  };
}
export async function resolveH2hSpecials(
  throughGw: number,
): Promise<{ winners: ResolvedWinner[]; category: PayoutCategory }> {
  const { results: raw } = await getAllH2hStandings(
    LEAGUE.h2h.leagueId,
    throughGw,
  );
  const suspended = await getSuspendedEntryIds("h2h");
  const results = filterOutSuspended(raw, suspended);

  const mostGsCandidates: FplCandidate[] = results.map((r) => ({
    entryId: r.entry,
    managerName: r.player_name,
    teamName: r.entry_name,
    transfersUsed: 0,
    metricLabel: H2H_LABELS.ptsFor,
    metricValue: r.points_for,
    sortKeys: [r.points_for],
  }));

  const fewestGcCandidates: FplCandidate[] = results.map((r) => ({
    entryId: r.entry,
    managerName: r.player_name,
    teamName: r.entry_name,
    transfersUsed: 0,
    metricLabel: H2H_LABELS.ptsAgainst,
    metricValue: r.points_against ?? 0,
    sortKeys: [-(r.points_against ?? 0)],
  }));

  const mostGs = applyFplPrizes(mostGsCandidates, [
    { place: 1, amountNgn: PRIZES.h2hSpecials[0].amountNgn },
  ]).map((w) => ({
    ...w,
    placeLabel: PRIZES.h2hSpecials[0].label,
    notes: w.notes ?? PRIZES.h2hSpecials[0].label,
  }));

  const fewestGc = applyFplPrizes(fewestGcCandidates, [
    { place: 1, amountNgn: PRIZES.h2hSpecials[1].amountNgn },
  ]).map((w) => ({
    ...w,
    placeLabel: PRIZES.h2hSpecials[1].label,
    notes: w.notes ?? PRIZES.h2hSpecials[1].label,
  }));

  return {
    category: "h2h_special",
    winners: [...mostGs, ...fewestGc],
  };
}

export { formatNgn, ordinal };
