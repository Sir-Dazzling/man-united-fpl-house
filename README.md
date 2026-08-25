# Man United Fan House League

FPL Classic + H2H analytics, cash desks, fraud banter, and earnings for the Man United Fan House League.

## Quick links

| Page | Purpose |
| ---- | ------- |
| `/` | Vibey home — this week teaser, how money works, join codes |
| `/rules` | House rules + full ranking algorithms |
| `/classic` `/h2h` | Live standings + PNG/CSV export |
| `/winners` | Weekly podium + fraud hall of shame |
| `/motm` | MOTM races + monthly table confirms |
| `/earnings` | Paid vs outstanding cash board |
| `/admin/gameweek` | Confirm weekly winners & mark paid |

## Algorithms (summary)

- **Classic weekly:** top GW points → transfers → split  
- **H2H weekly:** must win, then best margin → transfers → split  
- **Monthly table:** cumulative season top 4 at month end  
- **MOTM Classic:** sum of points in that month  
- **MOTM H2H:** month H2H pts (3/1/0) then GD  
- **Fraud:** banter only (worst week/month)

League IDs: Classic `539533` · H2H `539596`  
Codes: `0bcw9z` / `so9nz7` (case-sensitive)

## Dev

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Admin default: `admin@fanhouse.local` / `changeme`

```bash
docker compose up --build
```

Not affiliated with Manchester United FC or the Premier League. GGMU.
