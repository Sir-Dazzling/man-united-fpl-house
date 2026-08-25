import type {
  ClassicStandingsPage,
  EntryHistory,
  FplBootstrapStatic,
  H2hStandingsPage,
} from "./types";

const FPL_BASE = "https://fantasy.premierleague.com/api";

async function fplFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${FPL_BASE}${path}`, {
    next: { revalidate: 300 },
    headers: {
      "User-Agent": "man-united-fpl-house/0.1",
    },
  });

  if (!res.ok) {
    throw new Error(`FPL API ${path} failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/** Season bootstrap: gameweeks, teams, players. */
export function getBootstrapStatic() {
  return fplFetch<FplBootstrapStatic>("/bootstrap-static/");
}

/** Classic league standings (paginated). */
export function getClassicStandings(leagueId: number, page = 1) {
  return fplFetch<ClassicStandingsPage>(
    `/leagues-classic/${leagueId}/standings/?page_standings=${page}`,
  );
}

/** H2H league standings (paginated). */
export function getH2hStandings(leagueId: number, page = 1) {
  return fplFetch<H2hStandingsPage>(
    `/leagues-h2h/${leagueId}/standings/?page_standings=${page}`,
  );
}

/** Manager season history by entry ID. */
export function getEntryHistory(entryId: number) {
  return fplFetch<EntryHistory>(`/entry/${entryId}/history/`);
}

/**
 * Invite codes (e.g. 0bcw9z) are not the same as numeric league IDs.
 * Resolve IDs by joining once in FPL and reading the league URL, or set
 * LEAGUE.*.leagueId in league-config after first sync.
 */
export function assertLeagueId(
  leagueId: number | null,
  label: string,
): asserts leagueId is number {
  if (leagueId == null) {
    throw new Error(
      `${label} leagueId is not configured. Set it in src/lib/league-config.ts after resolving from FPL.`,
    );
  }
}
