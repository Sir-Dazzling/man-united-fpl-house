"use server";

import { confirmResolvedWinners, markGameweekPaid } from "@/lib/payout-actions";
import { isMonthFullyPlayed } from "@/lib/fpl/client";
import {
  resolveClassicMonthlyTable,
  resolveClassicMotm,
  resolveClassicWeekly,
  resolveH2hMonthlyTable,
  resolveH2hMotm,
  resolveH2hWeekly,
} from "@/lib/winners";
import type { ActionState } from "@/lib/payout-actions";

export async function confirmClassicWeeklyAction(formData: FormData) {
  const gw = Number(formData.get("gameweek"));
  const { winners, category } = await resolveClassicWeekly(gw);
  return confirmResolvedWinners({ gameweek: gw, category, winners });
}

export async function confirmH2hWeeklyAction(formData: FormData) {
  const gw = Number(formData.get("gameweek"));
  const { winners, category } = await resolveH2hWeekly(gw);
  return confirmResolvedWinners({ gameweek: gw, category, winners });
}

async function assertMonthReady(
  year: number,
  monthIndex: number,
): Promise<ActionState | null> {
  const status = await isMonthFullyPlayed(year, monthIndex);
  if (!status.ready) {
    return {
      ok: false,
      message:
        "Monthly table not available until the last gameweek of this month has been played.",
    };
  }
  return null;
}

export async function confirmClassicMonthlyAction(formData: FormData) {
  const year = Number(formData.get("year"));
  const monthIndex = Number(formData.get("monthIndex"));
  const throughGw = Number(formData.get("throughGw"));
  const monthKey = Number(formData.get("monthKey"));

  const blocked = await assertMonthReady(year, monthIndex);
  if (blocked) return blocked;

  const { winners, category } = await resolveClassicMonthlyTable(throughGw);
  return confirmResolvedWinners({
    gameweek: monthKey || throughGw,
    category,
    winners,
  });
}

export async function confirmH2hMonthlyAction(formData: FormData) {
  const year = Number(formData.get("year"));
  const monthIndex = Number(formData.get("monthIndex"));
  const throughGw = Number(formData.get("throughGw"));
  const monthKey = Number(formData.get("monthKey"));

  const blocked = await assertMonthReady(year, monthIndex);
  if (blocked) return blocked;

  const { winners, category } = await resolveH2hMonthlyTable(throughGw);
  return confirmResolvedWinners({
    gameweek: monthKey || throughGw,
    category,
    winners,
  });
}

export async function confirmClassicMotmAction(formData: FormData) {
  const year = Number(formData.get("year"));
  const monthIndex = Number(formData.get("monthIndex"));
  const monthKey = Number(formData.get("monthKey"));
  const { winners, category } = await resolveClassicMotm(year, monthIndex);
  return confirmResolvedWinners({
    gameweek: monthKey,
    category,
    winners,
  });
}

export async function confirmH2hMotmAction(formData: FormData) {
  const year = Number(formData.get("year"));
  const monthIndex = Number(formData.get("monthIndex"));
  const monthKey = Number(formData.get("monthKey"));
  const { winners, category } = await resolveH2hMotm(year, monthIndex);
  return confirmResolvedWinners({
    gameweek: monthKey,
    category,
    winners,
  });
}

export async function markWeeklyPaidAction(formData: FormData) {
  return markGameweekPaid(formData);
}
