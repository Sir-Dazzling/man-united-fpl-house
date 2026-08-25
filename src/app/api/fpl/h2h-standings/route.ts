import { NextResponse } from "next/server";
import {
  getAllH2hStandings,
  getCurrentGameweek,
} from "@/lib/fpl/client";
import { LEAGUE } from "@/lib/league-config";
import type { H2hStandingRow } from "@/lib/fpl/types";
import {
  filterOutSuspended,
  getSuspendedEntryIds,
} from "@/lib/suspensions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [{ league, results: raw }, gw, suspended] = await Promise.all([
      getAllH2hStandings(LEAGUE.h2h.leagueId),
      getCurrentGameweek(),
      getSuspendedEntryIds("h2h"),
    ]);
    const results = filterOutSuspended(raw, suspended);

    const topPf = results.reduce<H2hStandingRow | null>(
      (best, row) => (!best || row.points_for > best.points_for ? row : best),
      null,
    );
    const topPa = results.reduce<H2hStandingRow | null>((best, row) => {
      if (row.matches_played === 0) return best;
      const pa = row.points_against ?? 0;
      if (!best || pa < (best.points_against ?? Number.POSITIVE_INFINITY)) {
        return row;
      }
      return best;
    }, null);

    return NextResponse.json({
      league,
      results,
      hidden: raw.length - results.length,
      code: LEAGUE.h2h.code,
      gw: gw
        ? { id: gw.id, name: gw.name, finished: gw.finished }
        : null,
      topPf,
      topPa,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load H2H standings";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
