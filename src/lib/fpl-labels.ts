/** Shared FPL-facing column and metric labels for UI, CSV, and rules copy. */

export const CLASSIC_LABELS = {
  points: "Points",
  gwPoints: "GW Points",
  transfers: "Transfers",
  monthPoints: "Month points",
} as const;

export const H2H_LABELS = {
  pts: "Pts",
  ptsFor: "Pts For",
  ptsAgainst: "Pts Against",
  ptsDiff: "Pts Diff",
  h2hPts: "H2H pts",
  winMargin: "Win margin",
  lossMargin: "Loss margin",
} as const;

export const EOS_LABELS = {
  mostGoalsScored: "Most Goals Scored",
  fewestGoalsConceded: "Fewest Goals Conceded",
} as const;
