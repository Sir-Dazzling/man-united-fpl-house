import { NextResponse } from "next/server";
import {
  getAllClassicStandings,
  getCurrentGameweek,
  getEntryHistory,
} from "@/lib/fpl/client";
import { LEAGUE } from "@/lib/league-config";
import {
  filterOutSuspended,
  getSuspendedEntryIds,
} from "@/lib/suspensions";
import type { ClassicStandingRow } from "@/lib/fpl/types";

export const dynamic = "force-dynamic";

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
    Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, () =>
      worker(),
    ),
  );
  return out;
}

/**
 * Same GW points source as Winners: prefer entry history for the current GW
 * (matches FPL team page). Fall back to standings event_total if history
 * has no row yet. Adjust season total so GW + prior stay consistent.
 */
async function withHistoryGwPoints(
  rows: ClassicStandingRow[],
  gwId: number,
): Promise<ClassicStandingRow[]> {
  return mapPool(rows, 8, async (row) => {
    try {
      const history = await getEntryHistory(row.entry);
      const histRow = history.current.find((e) => e.event === gwId);
      if (!histRow) return row;
      const event_total = histRow.points ?? 0;
      const total = row.total - row.event_total + event_total;
      return { ...row, event_total, total };
    } catch {
      return row;
    }
  });
}

export async function GET() {
  try {
    const [{ league, results: raw }, gw, suspended] = await Promise.all([
      getAllClassicStandings(LEAGUE.classic.leagueId),
      getCurrentGameweek(),
      getSuspendedEntryIds("classic"),
    ]);
    const visible = filterOutSuspended(raw, suspended);
    const gwId = gw?.id ?? 1;
    const results = await withHistoryGwPoints(visible, gwId);

    // Keep table ordered by corrected season total (FPL rank can lag)
    results.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.event_total !== a.event_total) return b.event_total - a.event_total;
      return a.player_name.localeCompare(b.player_name);
    });
    results.forEach((row, i) => {
      row.rank = i + 1;
      row.rank_sort = i + 1;
    });

    return NextResponse.json({
      league,
      results,
      hidden: raw.length - results.length,
      code: LEAGUE.classic.code,
      gw: gw
        ? { id: gw.id, name: gw.name, finished: gw.finished }
        : null,
      gwSource: "entry_history",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load classic standings";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
