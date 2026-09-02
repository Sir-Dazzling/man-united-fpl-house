export const LEAGUE = {
  name: "Man United Fan House League",
  tagline: "Group chat energy, real Naira prizes.",
  classic: {
    label: "Classic",
    code: "0bcw9z",
    leagueId: Number(process.env.FPL_CLASSIC_LEAGUE_ID ?? 539533),
  },
  h2h: {
    label: "Head-to-Head",
    code: "so9nz7",
    leagueId: Number(process.env.FPL_H2H_LEAGUE_ID ?? 539596),
  },
} as const;

export const PRIZES = {
  weekly: [
    { place: 1, amountNgn: 5_000 },
    { place: 2, amountNgn: 3_000 },
    { place: 3, amountNgn: 2_000 },
    { place: 4, amountNgn: 1_000 },
  ],
  monthlyTable: [
    { place: 1, amountNgn: 5_000 },
    { place: 2, amountNgn: 3_000 },
    { place: 3, amountNgn: 2_000 },
    { place: 4, amountNgn: 1_000 },
  ],
  managerOfTheMonth: {
    classic: 10_000,
    h2h: 10_000,
  },
  endOfSeason: [
    { place: 1, amountNgn: 50_000 },
    { place: 2, amountNgn: 30_000 },
    { place: 3, amountNgn: 20_000 },
    { place: 4, amountNgn: 10_000 },
  ],
  h2hSpecials: [
    { id: "most-goals-scored", label: "Most Goals Scored", amountNgn: 10_000 },
    {
      id: "fewest-goals-conceded",
      label: "Fewest Goals Conceded",
      amountNgn: 10_000,
    },
  ],
} as const;

export type PayoutCategory =
  | "classic_weekly"
  | "h2h_weekly"
  | "classic_monthly"
  | "h2h_monthly"
  | "motm_classic"
  | "motm_h2h"
  | "classic_eos"
  | "h2h_eos"
  | "eos"
  | "h2h_special";

export const PAYOUT_CATEGORIES: Array<{
  value: PayoutCategory;
  label: string;
}> = [
  { value: "classic_weekly", label: "Classic weekly" },
  { value: "h2h_weekly", label: "H2H weekly" },
  { value: "classic_monthly", label: "Classic monthly table" },
  { value: "h2h_monthly", label: "H2H monthly table" },
  { value: "motm_classic", label: "Manager of the Month (Classic)" },
  { value: "motm_h2h", label: "Manager of the Month (H2H)" },
  { value: "classic_eos", label: "Classic end of season" },
  { value: "h2h_eos", label: "H2H end of season" },
  { value: "eos", label: "End of season (legacy)" },
  { value: "h2h_special", label: "H2H special" },
];

export function formatNgn(amount: number): string {
  if (amount >= 1000 && amount % 1000 === 0) {
    return `₦${amount / 1000}k`;
  }
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function ordinal(n: number): string {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}
