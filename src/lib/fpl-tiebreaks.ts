import { getEntryHistory } from "@/lib/fpl/client";
import { formatNgn, ordinal } from "@/lib/league-config";

const WC_FH_CHIPS = new Set(["wildcard", "freehit"]);

/** GWs where a Wildcard or Free Hit was played — transfers don't count. */
export function chipExcludedGameweeks(
  chips: Array<{ name: string; event: number }> | undefined,
): Set<number> {
  const excluded = new Set<number>();
  for (const chip of chips ?? []) {
    if (WC_FH_CHIPS.has(chip.name.toLowerCase())) {
      excluded.add(chip.event);
    }
  }
  return excluded;
}

/**
 * Sum event_transfers for the given gameweeks, excluding WC/FH weeks.
 * Pass all GWs 1..throughGw for season scope, or month GWs for monthly scope.
 */
export async function getFplTransferCount(
  entryId: number,
  gameweekIds: number[],
): Promise<number> {
  if (gameweekIds.length === 0) return 0;
  const history = await getEntryHistory(entryId);
  const excluded = chipExcludedGameweeks(history.chips);
  const allowed = new Set(gameweekIds);
  return history.current
    .filter((row) => allowed.has(row.event) && !excluded.has(row.event))
    .reduce((sum, row) => sum + (row.event_transfers ?? 0), 0);
}

export async function getFplTransferCountThroughGw(
  entryId: number,
  throughGw: number,
): Promise<number> {
  const ids = Array.from({ length: throughGw }, (_, i) => i + 1);
  return getFplTransferCount(entryId, ids);
}

export type FplCandidate = {
  entryId: number;
  managerName: string;
  teamName: string;
  transfersUsed: number;
  metricLabel: string;
  metricValue: number;
  /** Higher-is-better sort keys; ptsAgainst stored as negative for ascending tie-break */
  sortKeys: number[];
};

export type ResolvedFplWinner = {
  entryId: number;
  managerName: string;
  teamName: string;
  place: number;
  placeLabel: string;
  amountNgn: number;
  transfersUsed: number;
  notes: string | null;
  metricLabel: string;
  metricValue: number;
  split: boolean;
};

type PrizeBand = { place: number; amountNgn: number };

function compareSortKeys(a: FplCandidate, b: FplCandidate): number {
  const len = Math.max(a.sortKeys.length, b.sortKeys.length);
  for (let i = 0; i < len; i += 1) {
    const av = a.sortKeys[i] ?? 0;
    const bv = b.sortKeys[i] ?? 0;
    if (bv !== av) return bv - av;
  }
  if (a.transfersUsed !== b.transfersUsed) {
    return a.transfersUsed - b.transfersUsed;
  }
  return a.entryId - b.entryId;
}

function candidatesFullyTied(a: FplCandidate, b: FplCandidate): boolean {
  if (a.sortKeys.length !== b.sortKeys.length) return false;
  for (let i = 0; i < a.sortKeys.length; i += 1) {
    if (a.sortKeys[i] !== b.sortKeys[i]) return false;
  }
  return a.transfersUsed === b.transfersUsed;
}

function placeLabel(place: number, split: boolean) {
  return `${place}${ordinal(place)} place${split ? " (split)" : ""}`;
}

/** Rank by sortKeys (desc), then fewer transfers, then split prizes if still tied. */
export function applyFplPrizes(
  candidates: FplCandidate[],
  prizes: readonly PrizeBand[],
): ResolvedFplWinner[] {
  if (candidates.length === 0 || prizes.length === 0) return [];

  const sorted = [...candidates].sort(compareSortKeys);
  const winners: ResolvedFplWinner[] = [];
  let i = 0;
  let prizeIndex = 0;

  while (i < sorted.length && prizeIndex < prizes.length) {
    const head = sorted[i];
    let j = i + 1;
    while (j < sorted.length && candidatesFullyTied(sorted[j], head)) {
      j += 1;
    }

    const group = sorted.slice(i, j);
    const placesNeeded = group.length;
    const remainingPrizes = prizes.length - prizeIndex;
    const band = prizes.slice(
      prizeIndex,
      prizeIndex + Math.min(placesNeeded, remainingPrizes),
    );
    if (band.length === 0) break;

    const pool = band.reduce((sum, p) => sum + p.amountNgn, 0);
    const startPlace = band[0].place;
    const split = group.length > 1;
    const base = Math.floor(pool / group.length);
    let remainder = pool - base * group.length;

    for (const c of group) {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder -= 1;
      winners.push({
        entryId: c.entryId,
        managerName: c.managerName,
        teamName: c.teamName,
        place: startPlace,
        placeLabel: placeLabel(startPlace, split),
        amountNgn: base + extra,
        transfersUsed: c.transfersUsed,
        notes: split
          ? `Split ${formatNgn(pool)} across ${group.length} managers`
          : null,
        metricLabel: c.metricLabel,
        metricValue: c.metricValue,
        split,
      });
    }

    prizeIndex += band.length;
    i = j;
  }

  return winners;
}

/** Classic FPL: Points → fewest transfers (WC/FH excluded). */
export function classicSortKeys(points: number, transfers: number): number[] {
  return [points, -transfers];
}

/** H2H FPL: Pts → Pts For → Pts Diff → fewest Pts Against. */
export function h2hSortKeys(
  pts: number,
  ptsFor: number,
  ptsDiff: number,
  ptsAgainst: number,
): number[] {
  return [pts, ptsFor, ptsDiff, -ptsAgainst];
}

export function compareClassicFpl(
  a: { points: number; transfers: number; entryId: number },
  b: { points: number; transfers: number; entryId: number },
): number {
  return compareSortKeys(
    {
      entryId: a.entryId,
      managerName: "",
      teamName: "",
      transfersUsed: a.transfers,
      metricLabel: "",
      metricValue: 0,
      sortKeys: classicSortKeys(a.points, a.transfers),
    },
    {
      entryId: b.entryId,
      managerName: "",
      teamName: "",
      transfersUsed: b.transfers,
      metricLabel: "",
      metricValue: 0,
      sortKeys: classicSortKeys(b.points, b.transfers),
    },
  );
}

export function compareH2hFpl(
  a: {
    pts: number;
    ptsFor: number;
    ptsDiff: number;
    ptsAgainst: number;
    entryId: number;
  },
  b: {
    pts: number;
    ptsFor: number;
    ptsDiff: number;
    ptsAgainst: number;
    entryId: number;
  },
): number {
  return compareSortKeys(
    {
      entryId: a.entryId,
      managerName: "",
      teamName: "",
      transfersUsed: 0,
      metricLabel: "",
      metricValue: 0,
      sortKeys: h2hSortKeys(a.pts, a.ptsFor, a.ptsDiff, a.ptsAgainst),
    },
    {
      entryId: b.entryId,
      managerName: "",
      teamName: "",
      transfersUsed: 0,
      metricLabel: "",
      metricValue: 0,
      sortKeys: h2hSortKeys(b.pts, b.ptsFor, b.ptsDiff, b.ptsAgainst),
    },
  );
}

/** Pick worst candidate (inverse rank) for fraud boards. */
export function pickFplFraud(
  candidates: FplCandidate[],
  roast: string,
): Array<{
  entryId: number;
  managerName: string;
  teamName: string;
  transfersUsed: number;
  metricLabel: string;
  metricValue: number;
  roast: string;
}> {
  if (candidates.length === 0) return [];
  const sorted = [...candidates].sort((a, b) => {
    const len = Math.max(a.sortKeys.length, b.sortKeys.length);
    for (let i = 0; i < len; i += 1) {
      const av = a.sortKeys[i] ?? 0;
      const bv = b.sortKeys[i] ?? 0;
      if (av !== bv) return av - bv;
    }
    return b.transfersUsed - a.transfersUsed;
  });
  const head = sorted[0];
  return sorted
    .filter((c) => candidatesFullyTied(c, head))
    .map((c) => ({
      entryId: c.entryId,
      managerName: c.managerName,
      teamName: c.teamName,
      transfersUsed: c.transfersUsed,
      metricLabel: c.metricLabel,
      metricValue: c.metricValue,
      roast,
    }));
}
