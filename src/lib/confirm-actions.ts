"use server";

import { redirect } from "next/navigation";
import { confirmResolvedWinners, markGameweekPaid } from "@/lib/payout-actions";
import { isMonthFullyPlayed } from "@/lib/fpl/client";
import {
  resolveClassicMonthlyTable,
  resolveClassicMotm,
  resolveClassicWeekly,
  resolveClassicEos,
  resolveH2hEos,
  resolveH2hMonthlyTable,
  resolveH2hMotm,
  resolveH2hSpecials,
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

  const { winners, category } = await resolveClassicMonthlyTable(year, monthIndex);
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

  const { winners, category } = await resolveH2hMonthlyTable(year, monthIndex);
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

function flashQuery(message: string, ok: boolean) {
  return `msg=${encodeURIComponent(message)}&ok=${ok ? "1" : "0"}`;
}

export async function confirmClassicWeeklyAndRedirect(formData: FormData) {
  const gw = Number(formData.get("gameweek"));
  const res = await confirmClassicWeeklyAction(formData);
  redirect(`/admin/gameweek?gw=${gw}&${flashQuery(res.message, res.ok)}`);
}

export async function confirmH2hWeeklyAndRedirect(formData: FormData) {
  const gw = Number(formData.get("gameweek"));
  const res = await confirmH2hWeeklyAction(formData);
  redirect(`/admin/gameweek?gw=${gw}&${flashQuery(res.message, res.ok)}`);
}

export async function markClassicWeeklyPaidAndRedirect(formData: FormData) {
  const gw = Number(formData.get("gameweek"));
  const res = await markWeeklyPaidAction(formData);
  redirect(`/admin/gameweek?gw=${gw}&${flashQuery(res.message, res.ok)}`);
}

export async function markH2hWeeklyPaidAndRedirect(formData: FormData) {
  const gw = Number(formData.get("gameweek"));
  const res = await markWeeklyPaidAction(formData);
  redirect(`/admin/gameweek?gw=${gw}&${flashQuery(res.message, res.ok)}`);
}

export async function confirmClassicMotmAndRedirect(formData: FormData) {
  const year = Number(formData.get("year"));
  const monthIndex = Number(formData.get("monthIndex"));
  const res = await confirmClassicMotmAction(formData);
  redirect(
    `/motm?year=${year}&month=${monthIndex}&${flashQuery(res.message, res.ok)}`,
  );
}

export async function confirmH2hMotmAndRedirect(formData: FormData) {
  const year = Number(formData.get("year"));
  const monthIndex = Number(formData.get("monthIndex"));
  const res = await confirmH2hMotmAction(formData);
  redirect(
    `/motm?year=${year}&month=${monthIndex}&${flashQuery(res.message, res.ok)}`,
  );
}

export async function confirmClassicMonthlyAndRedirect(formData: FormData) {
  const year = Number(formData.get("year"));
  const monthIndex = Number(formData.get("monthIndex"));
  const res = await confirmClassicMonthlyAction(formData);
  redirect(
    `/motm?year=${year}&month=${monthIndex}&${flashQuery(res.message, res.ok)}`,
  );
}

export async function confirmH2hMonthlyAndRedirect(formData: FormData) {
  const year = Number(formData.get("year"));
  const monthIndex = Number(formData.get("monthIndex"));
  const res = await confirmH2hMonthlyAction(formData);
  redirect(
    `/motm?year=${year}&month=${monthIndex}&${flashQuery(res.message, res.ok)}`,
  );
}

export async function markMotmPaidAndRedirect(formData: FormData) {
  const year = Number(formData.get("year"));
  const monthIndex = Number(formData.get("monthIndex"));
  const res = await markWeeklyPaidAction(formData);
  redirect(
    `/motm?year=${year}&month=${monthIndex}&${flashQuery(res.message, res.ok)}`,
  );
}

export async function confirmClassicEosAction(formData: FormData) {
  const throughGw = Number(formData.get("throughGw"));
  const { winners, category } = await resolveClassicEos(throughGw);
  return confirmResolvedWinners({ gameweek: throughGw, category, winners });
}

export async function confirmH2hEosAction(formData: FormData) {
  const throughGw = Number(formData.get("throughGw"));
  const { winners, category } = await resolveH2hEos(throughGw);
  return confirmResolvedWinners({ gameweek: throughGw, category, winners });
}

export async function confirmH2hSpecialsAction(formData: FormData) {
  const throughGw = Number(formData.get("throughGw"));
  const { winners, category } = await resolveH2hSpecials(throughGw);
  return confirmResolvedWinners({ gameweek: throughGw, category, winners });
}

export async function confirmClassicEosAndRedirect(formData: FormData) {
  const res = await confirmClassicEosAction(formData);
  redirect(`/admin/eos?${flashQuery(res.message, res.ok)}`);
}

export async function confirmH2hEosAndRedirect(formData: FormData) {
  const res = await confirmH2hEosAction(formData);
  redirect(`/admin/eos?${flashQuery(res.message, res.ok)}`);
}

export async function confirmH2hSpecialsAndRedirect(formData: FormData) {
  const res = await confirmH2hSpecialsAction(formData);
  redirect(`/admin/eos?${flashQuery(res.message, res.ok)}`);
}

export async function markEosPaidAndRedirect(formData: FormData) {
  const res = await markWeeklyPaidAction(formData);
  redirect(`/admin/eos?${flashQuery(res.message, res.ok)}`);
}
