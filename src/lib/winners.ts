import {
  getAllClassicStandings,
  getAllH2hStandings,
  getCurrentGameweek,
  getEntryBadgeUrl,
  getGameweeksInMonth,
  getGwPoints,
  getH2hMatchesForEvent,
  getMonthGwPoints,
  getTransfersThroughGw,
} from "@/lib/fpl/client";
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

export type ResolvedWinner = {
  entryId: number;
  managerName: string;
  teamName: string;
  place: number;
  placeLabel: string;
  amountNgn: number;
  transfersUsed: number;
  notes: string | null;
  metricLabel: string;
  metricValue: number;
  split: boolean;
  badgeUrl?: string | null;
};

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

export type Candidate = {
  entryId: number;
  managerName: string;
  teamName: string;
  /** Higher is better for ranking before fraud inversion */
  sortPrimary: number;
  sortSecondary?: number;
  sortTertiary?: number;
  transfersUsed: number;
  metricLabel: string;
  metricValue: number;
};

function compareCandidatesDesc(a: Candidate, b: Candidate): number {
  if (b.sortPrimary !== a.sortPrimary) return b.sortPrimary - a.sortPrimary;
  const as = a.sortSecondary ?? 0;
  const bs = b.sortSecondary ?? 0;
  if (bs !== as) return bs - as;
  const at = a.sortTertiary ?? 0;
  const bt = b.sortTertiary ?? 0;
  if (bt !== at) return bt - at;
  return a.transfersUsed - b.transfersUsed;
}

function compareCandidatesAsc(a: Candidate, b: Candidate): number {
  if (a.sortPrimary !== b.sortPrimary) return a.sortPrimary - b.sortPrimary;
  const as = a.sortSecondary ?? 0;
  const bs = b.sortSecondary ?? 0;
  if (as !== bs) return as - bs;
  const at = a.sortTertiary ?? 0;
  const bt = b.sortTertiary ?? 0;
  if (at !== bt) return at - bt;
  return b.transfersUsed - a.transfersUsed;
}

function candidatesFullyTied(a: Candidate, b: Candidate): boolean {
  return (
    a.sortPrimary === b.sortPrimary &&
    (a.sortSecondary ?? 0) === (b.sortSecondary ?? 0) &&
    (a.sortTertiary ?? 0) === (b.sortTertiary ?? 0) &&
    a.transfersUsed === b.transfersUsed
  );
}

type PrizeBand = { place: number; amountNgn: number };

function placeLabel(place: number, split: boolean) {
  return `${place}${ordinal(place)} place${split ? " (split)" : ""}`;
}

/**
 * Rank candidates by primary desc, secondary desc, then fewer transfers.
 * Assign prize bands 1..N with splits when still fully tied on all keys.
 */
export function applyTransferTieBreakAndPrizes(
  candidates: Candidate[],
  prizes: readonly PrizeBand[],
): ResolvedWinner[] {
  if (candidates.length === 0 || prizes.length === 0) return [];

  const sorted = [...candidates].sort(compareCandidatesDesc);

  const winners: ResolvedWinner[] = [];
  let i = 0;
  let prizeIndex = 0;

  while (i < sorted.length && prizeIndex < prizes.length) {
    const head = sorted[i];
    let j = i + 1;
    while (j < sorted.length) {
      const cur = sorted[j];
      if (candidatesFullyTied(cur, head)) {
        j += 1;
      } else {
        break;
      }
    }

    const group = sorted.slice(i, j);
    const placesNeeded = group.length;
    const remainingPrizes = prizes.length - prizeIndex;
    const band = prizes.slice(
      prizeIndex,
      prizeIndex + Math.min(placesNeeded, remainingPrizes),
    );
    if (band.length === 0) break;

    const pool = band.reduce((sum, p) => sum + p.amountNgn, 0);
    const startPlace = band[0].place;
    const split = group.length > 1;
    const base = Math.floor(pool / group.length);
    let remainder = pool - base * group.length;

    for (const c of group) {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder -= 1;
      winners.push({
        entryId: c.entryId,
        managerName: c.managerName,
        teamName: c.teamName,
        place: startPlace,
        placeLabel: placeLabel(startPlace, split),
        amountNgn: base + extra,
        transfersUsed: c.transfersUsed,
        notes: split
          ? `Split ${formatNgn(pool)} across ${group.length} managers`
          : null,
        metricLabel: c.metricLabel,
        metricValue: c.metricValue,
        split,
      });
    }

    prizeIndex += band.length;
    i = j;
  }

  return winners;
}

export function pickFraud(
  candidates: Candidate[],
  roast: string,
): FraudResult[] {
  if (candidates.length === 0) return [];

  // Worst = lowest primary, then secondary, tertiary, then MORE transfers
  const sorted = [...candidates].sort(compareCandidatesAsc);

  const head = sorted[0];
  const group = sorted.filter((c) => candidatesFullyTied(c, head));

  return group.map((c) => ({
    entryId: c.entryId,
    managerName: c.managerName,
    teamName: c.teamName,
    transfersUsed: c.transfersUsed,
    metricLabel: c.metricLabel,
    metricValue: c.metricValue,
    roast,
  }));
}

async function withTransfers(
  rows: Array<{
    entryId: number;
    managerName: string;
    teamName: string;
    sortPrimary: number;
    sortSecondary?: number;
    metricLabel: string;
    metricValue: number;
  }>,
  throughGw: number,
): Promise<Candidate[]> {
  const out: Candidate[] = [];
  // Sequential to avoid hammering FPL; league is small (~40)
  for (const row of rows) {
    const transfersUsed = await getTransfersThroughGw(row.entryId, throughGw);
    out.push({ ...row, transfersUsed });
  }
  return out;
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

  // Future GW — no entries yet
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
  let rows: Array<{
    entryId: number;
    managerName: string;
    teamName: string;
    sortPrimary: number;
    metricLabel: string;
    metricValue: number;
  }>;

  // Prefer entry history for GW points (same source as Classic table / FPL team page).
  // Standings event_total is only a fallback when history has no row yet.
  rows = await Promise.all(
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
      return {
        entryId: r.entry,
        managerName: r.player_name,
        teamName: r.entry_name,
        sortPrimary: pts,
        metricLabel: "GW points",
        metricValue: pts,
      };
    }),
  );
  if (rows.every((r) => r.sortPrimary === 0)) {
    return {
      category: "classic_weekly",
      winners: [],
      fraud: [],
      emptyReason: useLive
        ? "No GW scores yet — check back after the deadline."
        : `No Classic scores recorded for GW${gw}.`,
    };
  }

  const candidates = await withTransfers(rows, gw);
  const [winners, fraud] = await Promise.all([
    attachBadgeUrls(
      applyTransferTieBreakAndPrizes(candidates, PRIZES.weekly),
    ),
    attachBadgeUrls(
      pickFraud(candidates, "Certified brick — lowest GW haul"),
    ),
  ]);
  return {
    category: "classic_weekly",
    winners,
    fraud,
    emptyReason: null,
  };
}

/** H2H weekly: must win, then best margin. */
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
  const winnerRows: Array<{
    entryId: number;
    managerName: string;
    teamName: string;
    sortPrimary: number;
    metricLabel: string;
    metricValue: number;
  }> = [];
  const loserRows: typeof winnerRows = [];

  for (const m of matches) {
    if (m.is_bye) continue;
    const p1 = m.entry_1_points ?? 0;
    const p2 = m.entry_2_points ?? 0;
    if (!m.entry_1_entry || !m.entry_2_entry) continue;

    if (p1 === p2) continue; // draws: no weekly win prize, no fraud

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

  const winnersC = await withTransfers(winnerRows, gw);
  const losersC = await withTransfers(loserRows, gw);

  const [winners, fraud] = await Promise.all([
    attachBadgeUrls(
      applyTransferTieBreakAndPrizes(winnersC, PRIZES.weekly),
    ),
    attachBadgeUrls(
      pickFraud(losersC, "Got cooked — worst H2H loss margin"),
    ),
  ]);
  return {
    category: "h2h_weekly",
    winners,
    fraud,
    emptyReason: null,
  };
}

/** Monthly table: season cumulative top 4. */
export async function resolveClassicMonthlyTable(
  throughGw: number,
): Promise<{ winners: ResolvedWinner[]; category: PayoutCategory }> {
  const { results: raw } = await getAllClassicStandings(LEAGUE.classic.leagueId);
  const suspended = await getSuspendedEntryIds("classic");
  const results = filterOutSuspended(raw, suspended);
  const rows = results.map((r) => ({
    entryId: r.entry,
    managerName: r.player_name,
    teamName: r.entry_name,
    sortPrimary: r.total,
    metricLabel: "Season points",
    metricValue: r.total,
  }));
  const candidates = await withTransfers(rows, throughGw);
  return {
    category: "classic_monthly",
    winners: applyTransferTieBreakAndPrizes(candidates, PRIZES.monthlyTable),
  };
}

export async function resolveH2hMonthlyTable(
  throughGw: number,
): Promise<{ winners: ResolvedWinner[]; category: PayoutCategory }> {
  const { results: raw } = await getAllH2hStandings(LEAGUE.h2h.leagueId);
  const suspended = await getSuspendedEntryIds("h2h");
  const results = filterOutSuspended(raw, suspended);
  const rows = results.map((r) => ({
    entryId: r.entry,
    managerName: r.player_name,
    teamName: r.entry_name,
    sortPrimary: r.total,
    sortSecondary: r.points_for,
    sortTertiary: r.points_for - (r.points_against ?? 0),
    metricLabel: "H2H pts",
    metricValue: r.total,
  }));
  const candidates = await withTransfers(rows, throughGw);
  return {
    category: "h2h_monthly",
    winners: applyTransferTieBreakAndPrizes(candidates, PRIZES.monthlyTable),
  };
}

/** Classic MOTM: sum of GW points in calendar month. */
export async function resolveClassicMotm(
  year: number,
  monthIndex: number,
): Promise<{
  winners: ResolvedWinner[];
  fraud: FraudResult[];
  category: PayoutCategory;
  gameweekIds: number[];
}> {
  const gws = await getGameweeksInMonth(year, monthIndex);
  const finished = gws.filter((g) => g.finished);
  const ids = finished.map((g) => g.id);
  const throughGw = ids.at(-1) ?? 1;
  const { results: raw } = await getAllClassicStandings(LEAGUE.classic.leagueId);
  const suspended = await getSuspendedEntryIds("classic");
  const results = filterOutSuspended(raw, suspended);

  const rows = [];
  for (const r of results) {
    const pts = await getMonthGwPoints(r.entry, ids);
    rows.push({
      entryId: r.entry,
      managerName: r.player_name,
      teamName: r.entry_name,
      sortPrimary: pts,
      metricLabel: "Month points",
      metricValue: pts,
    });
  }

  const candidates = await withTransfers(rows, throughGw);
  const motmPrize = [
    { place: 1, amountNgn: PRIZES.managerOfTheMonth.classic },
  ] as const;

  return {
    category: "motm_classic",
    gameweekIds: ids,
    winners: applyTransferTieBreakAndPrizes(candidates, motmPrize),
    fraud: pickFraud(candidates, "Fraud of the Month — coldest Classic month"),
  };
}

/** H2H MOTM: month match pts then total GD. */
export async function resolveH2hMotm(
  year: number,
  monthIndex: number,
): Promise<{
  winners: ResolvedWinner[];
  fraud: FraudResult[];
  category: PayoutCategory;
  gameweekIds: number[];
}> {
  const gws = await getGameweeksInMonth(year, monthIndex);
  const finished = gws.filter((g) => g.finished);
  const ids = finished.map((g) => g.id);
  const throughGw = ids.at(-1) ?? 1;
  const suspended = await getSuspendedEntryIds("h2h");

  const stats = new Map<
    number,
    {
      entryId: number;
      managerName: string;
      teamName: string;
      matchPts: number;
      gd: number;
    }
  >();

  const bump = (
    entryId: number,
    managerName: string,
    teamName: string,
    matchPts: number,
    gd: number,
  ) => {
    if (suspended.has(entryId)) return;
    const cur = stats.get(entryId) ?? {
      entryId,
      managerName,
      teamName,
      matchPts: 0,
      gd: 0,
    };
    cur.matchPts += matchPts;
    cur.gd += gd;
    cur.managerName = managerName;
    cur.teamName = teamName;
    stats.set(entryId, cur);
  };

  for (const gw of ids) {
    const matches = await getH2hMatchesForEvent(LEAGUE.h2h.leagueId, gw);
    for (const m of matches) {
      if (m.is_bye || !m.entry_1_entry || !m.entry_2_entry) continue;
      const p1 = m.entry_1_points ?? 0;
      const p2 = m.entry_2_points ?? 0;
      const gd1 = p1 - p2;
      const gd2 = p2 - p1;
      let pts1 = 1;
      let pts2 = 1;
      if (p1 > p2) {
        pts1 = 3;
        pts2 = 0;
      } else if (p2 > p1) {
        pts1 = 0;
        pts2 = 3;
      }
      bump(
        m.entry_1_entry,
        m.entry_1_player_name ?? "Unknown",
        m.entry_1_name ?? "",
        pts1,
        gd1,
      );
      bump(
        m.entry_2_entry,
        m.entry_2_player_name ?? "Unknown",
        m.entry_2_name ?? "",
        pts2,
        gd2,
      );
    }
  }

  const rows = [...stats.values()].map((s) => ({
    entryId: s.entryId,
    managerName: s.managerName,
    teamName: s.teamName,
    sortPrimary: s.matchPts,
    sortSecondary: s.gd,
    metricLabel: "H2H pts (GD)",
    metricValue: s.matchPts,
  }));

  const candidates = await withTransfers(rows, throughGw);
  const motmPrize = [
    { place: 1, amountNgn: PRIZES.managerOfTheMonth.h2h },
  ] as const;

  return {
    category: "motm_h2h",
    gameweekIds: ids,
    winners: applyTransferTieBreakAndPrizes(candidates, motmPrize),
    fraud: pickFraud(
      candidates,
      "Fraud of the Month — H2H nightmare fuel",
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
