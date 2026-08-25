import { NextResponse } from "next/server";
import { getCurrentGameweek } from "@/lib/fpl/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const gw = await getCurrentGameweek();
    return NextResponse.json({
      gwId: gw?.id ?? 1,
      gwName: gw?.name ?? "Gameweek 1",
      finished: gw?.finished ?? false,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load bootstrap";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
