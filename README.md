# Man United Fan House League

Private FPL analytics + payouts platform for the **Man United Fan House League** — Classic and Head-to-Head, weekly cash tracking, and season earnings.

## League codes (case-sensitive)

| League  | Code     |
| ------- | -------- |
| Classic | `0bcw9z` |
| H2H     | `so9nz7` |

Set numeric FPL `leagueId` values in [`src/lib/league-config.ts`](src/lib/league-config.ts) after resolving them from FPL (invite code ≠ league ID).

## Prize summary

- **Weekly (Classic & H2H):** 1st ₦5k · 2nd ₦3k · 3rd ₦2k · 4th ₦1k
- **Manager of the Month:** Classic ₦10k · H2H ₦10k
- **End of season (both):** 1st ₦50k · 2nd ₦30k · 3rd ₦20k · 4th ₦10k
- **H2H specials:** Most Goals Scored ₦10k · Fewest Goals Conceded ₦10k

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Public FPL API client stubs in `src/lib/fpl/`

## Routes

- `/` — landing, join codes, prize pool, announcement poster
- `/classic` — Classic standings (wired next)
- `/h2h` — H2H standings + PF/PA specials (wired next)
- `/earnings` — who earned the most
- `/admin/payouts` — log weekly winners

## Dev

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Next up

- Resolve Classic / H2H league IDs and fetch live standings
- Persist payouts (DB) and drive the earnings leaderboard
- Admin auth + gameweek sync

Not affiliated with Manchester United FC or the Premier League. GGMU.
