import { NextResponse } from "next/server";
import {
  getH2hMatchesForEvent,
  getSeasonGameweeks,
} from "@/lib/fpl/client";
import { LEAGUE } from "@/lib/league-config";
import { getSuspendedEntryIds } from "@/lib/suspensions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const gameweeks = await getSeasonGameweeks();
    const current =
      gameweeks.find((g) => g.isCurrent) ??
      gameweeks.filter((g) => g.finished).at(-1);
    const gw = Number(url.searchParams.get("gw") ?? current?.id ?? 1);
    const meta = gameweeks.find((g) => g.id === gw) ?? null;
    const matches = await getH2hMatchesForEvent(LEAGUE.h2h.leagueId, gw);
    const suspendedH2h = await getSuspendedEntryIds("h2h");
    const suspendedClassic = await getSuspendedEntryIds("classic");
    const suspendedEntryIds = [
      ...new Set([...suspendedH2h, ...suspendedClassic]),
    ];

    return NextResponse.json({
      gw,
      meta,
      gameweeks,
      code: LEAGUE.h2h.code,
      suspendedEntryIds,
      matches: matches.map((m) => ({
        id: m.id,
        isBye: m.is_bye,
        entry1: m.entry_1_entry
          ? {
              entryId: m.entry_1_entry,
              teamName: m.entry_1_name ?? "",
              managerName: m.entry_1_player_name ?? "Unknown",
              points: m.entry_1_points,
            }
          : null,
        entry2: m.entry_2_entry
          ? {
              entryId: m.entry_2_entry,
              teamName: m.entry_2_name ?? "",
              managerName: m.entry_2_player_name ?? "Unknown",
              points: m.entry_2_points,
            }
          : null,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load fixtures";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
