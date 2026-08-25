export const LEAGUE = {
  name: "Man United Fan House League",
  tagline: "Classic + H2H · Vibes, Banter & Cash",
  classic: {
    label: "Classic",
    code: "0bcw9z",
    /** Set once resolved from FPL (league ID, not invite code). */
    leagueId: null as number | null,
  },
  h2h: {
    label: "Head-to-Head",
    code: "so9nz7",
    leagueId: null as number | null,
  },
} as const;

export const PRIZES = {
  weekly: [
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

export function formatNgn(amount: number): string {
  if (amount >= 1000) {
    return `₦${amount / 1000}k`;
  }
  return `₦${amount.toLocaleString("en-NG")}`;
}
