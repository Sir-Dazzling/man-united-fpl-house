import { NextResponse } from "next/server";
import { getHomeLeadsPayload } from "@/lib/gw-leads";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getHomeLeadsPayload();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load home leads";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
