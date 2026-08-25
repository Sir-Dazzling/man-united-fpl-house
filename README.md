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

## Database (Neon)

Admin, payouts, and suspensions use **Neon Postgres** (required for Vercel — local SQLite is not used).

1. Create a free project at [neon.tech](https://neon.tech).
2. In the Neon dashboard, copy:
   - **Pooled** connection string → `DATABASE_URL`
   - **Direct** connection string → `DIRECT_URL`
3. Put both in `.env` (see `.env.example`).

## Dev

```bash
cp .env.example .env
# paste Neon DATABASE_URL + DIRECT_URL into .env
npm install
npm run db:setup   # migrate + seed admin
npm run dev
```

Admin default: `admin@fanhouse.local` / `changeme` (override with `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

```bash
# Docker also needs Neon URLs in .env
docker compose up --build
```

## Vercel

Set these environment variables in the Vercel project:

| Variable | Notes |
| -------- | ----- |
| `DATABASE_URL` | Neon **pooled** URL |
| `DIRECT_URL` | Neon **direct** URL (migrations) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First admin (seed) |
| `FPL_CLASSIC_LEAGUE_ID` / `FPL_H2H_LEAGUE_ID` | Defaults exist; set to override |

`npm run build` runs `prisma migrate deploy` then Next.js build. After the first deploy, run seed once if the admin user is missing:

```bash
# with Neon URLs in env
npm run db:seed
```

Or seed locally against the same Neon DB with `npm run db:setup` before deploying.

Not affiliated with Manchester United FC or the Premier League. GGMU.
