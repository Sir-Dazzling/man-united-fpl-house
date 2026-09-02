import {
  getAllClassicStandings,
  getGameweeksInMonth,
  getH2hMatchesForEvent,
  getMonthGwPoints,
} from "@/lib/fpl/client";
import { getFplTransferCount } from "@/lib/fpl-tiebreaks";
import { LEAGUE } from "@/lib/league-config";
import {
  filterOutSuspended,
  getSuspendedEntryIds,
} from "@/lib/suspensions";

export type ClassicMonthRow = {
  entryId: number;
  managerName: string;
  teamName: string;
  monthPoints: number;
  monthTransfers: number;
};

export type H2hMonthRow = {
  entryId: number;
  managerName: string;
  teamName: string;
  matchPts: number;
  ptsFor: number;
  ptsAgainst: number;
  ptsDiff: number;
  wins: number;
  draws: number;
  losses: number;
};

export async function getClassicMonthStats(
  year: number,
  monthIndex: number,
): Promise<{ gameweekIds: number[]; rows: ClassicMonthRow[] }> {
  const gws = await getGameweeksInMonth(year, monthIndex);
  const gameweekIds = gws.filter((g) => g.finished).map((g) => g.id);

  const { results: raw } = await getAllClassicStandings(LEAGUE.classic.leagueId);
  const suspended = await getSuspendedEntryIds("classic");
  const results = filterOutSuspended(raw, suspended);

  const rows: ClassicMonthRow[] = [];
  for (const r of results) {
    const [monthPoints, monthTransfers] = await Promise.all([
      getMonthGwPoints(r.entry, gameweekIds),
      getFplTransferCount(r.entry, gameweekIds),
    ]);
    rows.push({
      entryId: r.entry,
      managerName: r.player_name,
      teamName: r.entry_name,
      monthPoints,
      monthTransfers,
    });
  }

  return { gameweekIds, rows };
}

export async function getH2hMonthStats(
  year: number,
  monthIndex: number,
): Promise<{ gameweekIds: number[]; rows: H2hMonthRow[] }> {
  const gws = await getGameweeksInMonth(year, monthIndex);
  const gameweekIds = gws.filter((g) => g.finished).map((g) => g.id);
  const suspended = await getSuspendedEntryIds("h2h");

  const stats = new Map<
    number,
    {
      entryId: number;
      managerName: string;
      teamName: string;
      matchPts: number;
      ptsFor: number;
      ptsAgainst: number;
      wins: number;
      draws: number;
      losses: number;
    }
  >();

  const bump = (
    entryId: number,
    managerName: string,
    teamName: string,
    matchPts: number,
    ptsFor: number,
    ptsAgainst: number,
  ) => {
    if (suspended.has(entryId)) return;
    const cur = stats.get(entryId) ?? {
      entryId,
      managerName,
      teamName,
      matchPts: 0,
      ptsFor: 0,
      ptsAgainst: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    };
    cur.matchPts += matchPts;
    cur.ptsFor += ptsFor;
    cur.ptsAgainst += ptsAgainst;
    if (matchPts === 3) cur.wins += 1;
    else if (matchPts === 1) cur.draws += 1;
    else cur.losses += 1;
    cur.managerName = managerName;
    cur.teamName = teamName;
    stats.set(entryId, cur);
  };

  for (const gw of gameweekIds) {
    const matches = await getH2hMatchesForEvent(LEAGUE.h2h.leagueId, gw);
    for (const m of matches) {
      if (m.is_bye || !m.entry_1_entry || !m.entry_2_entry) continue;
      const p1 = m.entry_1_points ?? 0;
      const p2 = m.entry_2_points ?? 0;
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
        p1,
        p2,
      );
      bump(
        m.entry_2_entry,
        m.entry_2_player_name ?? "Unknown",
        m.entry_2_name ?? "",
        pts2,
        p2,
        p1,
      );
    }
  }

  const rows = [...stats.values()].map((s) => ({
    ...s,
    ptsDiff: s.ptsFor - s.ptsAgainst,
  }));

  return { gameweekIds, rows };
}
