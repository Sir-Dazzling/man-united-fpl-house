import { NextResponse } from "next/server";
import {
  getAllClassicStandings,
  getCurrentGameweek,
} from "@/lib/fpl/client";
import { LEAGUE } from "@/lib/league-config";
import {
  filterOutSuspended,
  getSuspendedEntryIds,
} from "@/lib/suspensions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [{ league, results: raw }, gw, suspended] = await Promise.all([
      getAllClassicStandings(LEAGUE.classic.leagueId),
      getCurrentGameweek(),
      getSuspendedEntryIds("classic"),
    ]);
    const results = filterOutSuspended(raw, suspended);
    return NextResponse.json({
      league,
      results,
      hidden: raw.length - results.length,
      code: LEAGUE.classic.code,
      gw: gw
        ? { id: gw.id, name: gw.name, finished: gw.finished }
        : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load classic standings";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
