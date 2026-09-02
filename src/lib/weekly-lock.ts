import { prisma } from "@/lib/db";
import { PRIZES } from "@/lib/league-config";
import type { FraudResult, ResolvedWinner } from "@/lib/winners";

/** GWs whose weekly winners are frozen to DB payouts (already paid). */
export const LOCKED_WEEKLY_GAMEWEEKS = [1] as const;

export type WeeklyResolveResult = {
  winners: ResolvedWinner[];
  fraud: FraudResult[];
  category: "classic_weekly" | "h2h_weekly";
  emptyReason: string | null;
};

type WeeklyLiveResult = {
  winners: ResolvedWinner[];
  fraud: FraudResult[];
  category: string;
  emptyReason: string | null;
};

function payoutToWinner(p: {
  entryId: number | null;
  managerName: string;
  placeLabel: string;
  amountNgn: number;
  transfersUsed: number | null;
  notes: string | null;
}): ResolvedWinner {
  const placeMatch = p.placeLabel.match(/^(\d+)/);
  const place = placeMatch ? Number(placeMatch[1]) : 1;
  return {
    entryId: p.entryId ?? 0,
    managerName: p.managerName,
    teamName: "",
    place,
    placeLabel: p.placeLabel,
    amountNgn: p.amountNgn,
    transfersUsed: p.transfersUsed ?? 0,
    notes: p.notes,
    metricLabel: "",
    metricValue: 0,
    split: p.placeLabel.includes("split"),
  };
}

async function isWeeklyLocked(
  gw: number,
  category: "classic_weekly" | "h2h_weekly",
): Promise<boolean> {
  if ((LOCKED_WEEKLY_GAMEWEEKS as readonly number[]).includes(gw)) {
    const any = await prisma.payout.count({
      where: { gameweek: gw, category },
    });
    return any > 0;
  }

  const paidCount = await prisma.payout.count({
    where: { gameweek: gw, category, status: "paid" },
  });
  return paidCount >= PRIZES.weekly.length;
}

/**
 * For locked gameweeks, return canonical winners from confirmed payouts
 * so retroactive rule changes never alter paid results.
 */
export async function resolveWeeklyForDisplay(
  gw: number,
  category: "classic_weekly" | "h2h_weekly",
  liveResolve: () => Promise<WeeklyLiveResult>,
): Promise<WeeklyResolveResult> {
  const locked = await isWeeklyLocked(gw, category);
  if (!locked) {
    const live = await liveResolve();
    return { ...live, category };
  }

  const payouts = await prisma.payout.findMany({
    where: {
      gameweek: gw,
      category,
      status: { in: ["announced", "paid"] },
    },
    orderBy: [{ amountNgn: "desc" }, { placeLabel: "asc" }],
  });

  if (payouts.length === 0) {
    const live = await liveResolve();
    return { ...live, category };
  }

  const live = await liveResolve();
  return {
    category,
    winners: payouts.map(payoutToWinner),
    fraud: live.fraud,
    emptyReason: null,
  };
}
