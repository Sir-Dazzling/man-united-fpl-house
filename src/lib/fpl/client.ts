import type {
  ClassicStandingRow,
  ClassicStandingsPage,
  EntryHistory,
  FplBootstrapStatic,
  FplEntry,
  H2hMatchesPage,
  H2hMatchRow,
  H2hStandingRow,
  H2hStandingsPage,
} from "./types";

const FPL_BASE = "https://fantasy.premierleague.com/api";

async function fplFetch<T>(path: string, revalidate = 300): Promise<T> {
  const res = await fetch(`${FPL_BASE}${path}`, {
    next: { revalidate },
    headers: {
      "User-Agent": "man-united-fpl-house/0.1",
    },
  });

  if (!res.ok) {
    throw new Error(`FPL API ${path} failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export function getBootstrapStatic() {
  return fplFetch<FplBootstrapStatic>("/bootstrap-static/");
}

export function getEntry(entryId: number) {
  return fplFetch<FplEntry>(`/entry/${entryId}/`);
}

/**
 * Custom FPL team badge from entry `club_badge_src`.
 * Returns null when unset, pending moderation, or fetch fails.
 */
export async function getEntryBadgeUrl(
  entryId: number,
): Promise<string | null> {
  try {
    const entry = await getEntry(entryId);
    const src = entry.club_badge_src;
    if (!src || src === "Pending" || !src.startsWith("http")) return null;
    return src;
  } catch {
    return null;
  }
}

/** @deprecated Prefer getEntryBadgeUrl — kept as alias for callers. */
export async function getEntryCrestUrl(entryId: number) {
  return getEntryBadgeUrl(entryId);
}

export async function getCurrentGameweek(): Promise<{
  id: number;
  name: string;
  finished: boolean;
  isCurrent: boolean;
} | null> {
  const data = await getBootstrapStatic();
  const current =
    data.events.find((e) => e.is_current) ??
    data.events.filter((e) => e.finished).at(-1) ??
    null;
  return current
    ? {
        id: current.id,
        name: current.name,
        finished: current.finished,
        isCurrent: Boolean(current.is_current),
      }
    : null;
}

export async function getGameweekById(gw: number) {
  const data = await getBootstrapStatic();
  return data.events.find((e) => e.id === gw) ?? null;
}

/** Calendar months that contain at least one FPL gameweek deadline. */
export async function getSeasonMonths(): Promise<
  Array<{ year: number; monthIndex: number; label: string }>
> {
  const data = await getBootstrapStatic();
  const seen = new Map<string, { year: number; monthIndex: number }>();
  for (const e of data.events) {
    const d = new Date(e.deadline_time);
    const year = d.getUTCFullYear();
    const monthIndex = d.getUTCMonth();
    const key = `${year}-${monthIndex}`;
    if (!seen.has(key)) seen.set(key, { year, monthIndex });
  }
  return [...seen.values()]
    .sort((a, b) => a.year - b.year || a.monthIndex - b.monthIndex)
    .map(({ year, monthIndex }) => ({
      year,
      monthIndex,
      label: new Date(Date.UTC(year, monthIndex, 1)).toLocaleString("en-GB", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }),
    }));
}

export async function getSeasonGameweeks(): Promise<
  Array<{
    id: number;
    name: string;
    finished: boolean;
    isCurrent: boolean;
    deadline: string;
  }>
> {
  const data = await getBootstrapStatic();
  return data.events.map((e) => ({
    id: e.id,
    name: e.name,
    finished: e.finished,
    isCurrent: e.is_current,
    deadline: e.deadline_time,
  }));
}

export async function getFinishedGameweeks() {
  const data = await getBootstrapStatic();
  return data.events.filter((e) => e.finished);
}

export async function getGameweeksInMonth(year: number, monthIndex: number) {
  const data = await getBootstrapStatic();
  return data.events.filter((e) => {
    const d = new Date(e.deadline_time);
    return d.getUTCFullYear() === year && d.getUTCMonth() === monthIndex;
  });
}

/** True when the month has FPL GWs and every one of them is finished. */
export async function isMonthFullyPlayed(year: number, monthIndex: number) {
  const gws = await getGameweeksInMonth(year, monthIndex);
  if (gws.length === 0) {
    return { ready: false as const, gws, finished: [], lastGwId: null as number | null };
  }
  const finished = gws.filter((e) => e.finished);
  const ready = finished.length === gws.length;
  return {
    ready,
    gws,
    finished,
    lastGwId: gws.at(-1)?.id ?? null,
  };
}

export function getClassicStandings(leagueId: number, page = 1) {
  return fplFetch<ClassicStandingsPage>(
    `/leagues-classic/${leagueId}/standings/?page_standings=${page}`,
  );
}

export function getH2hStandings(leagueId: number, page = 1) {
  return fplFetch<H2hStandingsPage>(
    `/leagues-h2h/${leagueId}/standings/?page_standings=${page}`,
  );
}

export async function getAllClassicStandings(leagueId: number): Promise<{
  league: ClassicStandingsPage["league"];
  results: ClassicStandingRow[];
}> {
  const first = await getClassicStandings(leagueId, 1);
  const results = [...first.standings.results];
  let page = 1;
  let hasNext = first.standings.has_next;

  while (hasNext) {
    page += 1;
    const next = await getClassicStandings(leagueId, page);
    results.push(...next.standings.results);
    hasNext = next.standings.has_next;
  }

  return { league: first.league, results };
}

export async function getAllH2hStandings(leagueId: number): Promise<{
  league: H2hStandingsPage["league"];
  results: H2hStandingRow[];
}> {
  const first = await getH2hStandings(leagueId, 1);
  const results = [...first.standings.results];
  let page = 1;
  let hasNext = first.standings.has_next;

  while (hasNext) {
    page += 1;
    const next = await getH2hStandings(leagueId, page);
    results.push(...next.standings.results);
    hasNext = next.standings.has_next;
  }

  const gw = await getCurrentGameweek();
  const throughGw = gw?.id ?? 1;
  const paByEntry = await computeH2hPointsAgainst(leagueId, throughGw);
  const enriched = results.map((row) => ({
    ...row,
    points_against: paByEntry.get(row.entry) ?? row.points_against ?? 0,
  }));

  return { league: first.league, results: enriched };
}

/**
 * FPL H2H standings often omit points_against — sum opponents' GW scores
 * from match fixtures through the given gameweek.
 */
export async function computeH2hPointsAgainst(
  leagueId: number,
  throughGw: number,
): Promise<Map<number, number>> {
  const pa = new Map<number, number>();
  const tasks = Array.from({ length: Math.max(throughGw, 0) }, (_, i) =>
    getH2hMatchesForEvent(leagueId, i + 1),
  );
  const batches = await Promise.all(tasks);
  for (const matches of batches) {
    for (const m of matches) {
      if (m.is_bye) continue;
      if (m.entry_1_entry != null && m.entry_2_points != null) {
        pa.set(
          m.entry_1_entry,
          (pa.get(m.entry_1_entry) ?? 0) + m.entry_2_points,
        );
      }
      if (m.entry_2_entry != null && m.entry_1_points != null) {
        pa.set(
          m.entry_2_entry,
          (pa.get(m.entry_2_entry) ?? 0) + m.entry_1_points,
        );
      }
    }
  }
  return pa;
}

export function getEntryHistory(entryId: number) {
  return fplFetch<EntryHistory>(`/entry/${entryId}/history/`);
}

export async function getH2hMatchesForEvent(
  leagueId: number,
  event: number,
): Promise<H2hMatchRow[]> {
  const first = await fplFetch<H2hMatchesPage>(
    `/leagues-h2h-matches/league/${leagueId}/?event=${event}&page=1`,
  );
  const results = [...first.results];
  let page = 1;
  let hasNext = first.has_next;

  while (hasNext) {
    page += 1;
    const next = await fplFetch<H2hMatchesPage>(
      `/leagues-h2h-matches/league/${leagueId}/?event=${event}&page=${page}`,
    );
    results.push(...next.results);
    hasNext = next.has_next;
  }

  return results;
}

export async function getTransfersThroughGw(
  entryId: number,
  throughGw: number,
): Promise<number> {
  const history = await getEntryHistory(entryId);
  return history.current
    .filter((row) => row.event <= throughGw)
    .reduce((sum, row) => sum + (row.event_transfers ?? 0), 0);
}

export async function getGwPoints(
  entryId: number,
  gw: number,
): Promise<number> {
  const history = await getEntryHistory(entryId);
  return history.current.find((row) => row.event === gw)?.points ?? 0;
}

export async function getMonthGwPoints(
  entryId: number,
  gameweekIds: number[],
): Promise<number> {
  if (gameweekIds.length === 0) return 0;
  const history = await getEntryHistory(entryId);
  const set = new Set(gameweekIds);
  return history.current
    .filter((row) => set.has(row.event))
    .reduce((sum, row) => sum + row.points, 0);
}
