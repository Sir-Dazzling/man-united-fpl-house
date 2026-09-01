import Link from "next/link";
import { formatNgn, LEAGUE, PRIZES } from "@/lib/league-config";

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">House law</p>
      <h1 className="mt-2 font-display text-4xl text-white">
        Rules &amp; ranking algorithms
      </h1>
      <p className="mt-3 text-white/60">
        Read this before the group chat turns into VAR. FPL can show tied ranks;
        cash places use our tie-breaks.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl text-white">House rules</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-white/70">
          <li>
            <strong className="text-white">Group members &amp; true Reds only.</strong>{" "}
            Non-members or rival fans = DQ (and whoever shared the code).
          </li>
          <li>
            <strong className="text-white">One manager, one team.</strong> Multi
            accounts = instant DQ from all payouts.
          </li>
          <li>
            <strong className="text-white">Tie-breakers:</strong> fewer total
            transfers up to that point. Still tied → prize split evenly.
          </li>
          <li>
            <strong className="text-white">VAR:</strong> FPL deadlines are law.
            Admin edge cases are final.
          </li>
          <li>
            <strong className="text-white">Claiming cash:</strong> when announced
            in the group, DM account details — never drop them in the main chat.
          </li>
          <li>
            Join <strong className="text-white">both</strong> leagues: Classic{" "}
            <span className="font-mono text-gold">{LEAGUE.classic.code}</span> ·
            H2H <span className="font-mono text-gold">{LEAGUE.h2h.code}</span>{" "}
            (case-sensitive).
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-2xl text-white">Classic algorithms</h2>
        <RuleBlock
          title="Weekly (cash)"
          body="Highest GW points that gameweek. Top 4 get paid. Example: 80, 75, 75, 70 → transfers break the 75-75, then 4th is 70."
        />
        <RuleBlock
          title="Monthly table (cash)"
          body="After the last finished GW of the calendar month, take the season Classic standings and pay cumulative 1st–4th. Hidden until that last GW has been played — not shown mid-month. This is who leads the league so far — not who scored most that month."
        />
        <RuleBlock
          title="Manager of the Month (cash)"
          body="Sum GW points only for gameweeks in that month. Highest total wins ₦10k."
        />
        <RuleBlock
          title="Fraud of the week / month (banter)"
          body="Lowest GW points (week) or lowest month points sum (month). No cash — just shame. Tie → more transfers = bigger fraud."
        />
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-2xl text-white">H2H algorithms</h2>
        <RuleBlock
          title="Weekly (cash)"
          body="You must win your H2H match that GW. Among winners, best goal margin (your score − opponent). Top 4 paid. Draws/losses are out."
        />
        <RuleBlock
          title="Monthly table (cash)"
          body="Season H2H standings snapshot at month end — pay cumulative 1st–4th. Tie-break: H2H pts, then GS, then GD, then transfers / split. Not available until the month’s last GW has been played."
        />
        <RuleBlock
          title="Manager of the Month (cash)"
          body="In that month: most H2H match points (3/1/0), then best total goal difference, then transfers / split."
        />
        <RuleBlock
          title="Fraud of the week / month (banter)"
          body="Week: worst loss margin among losers. Month: fewest H2H pts, then worst GD. No cash."
        />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-white">Prize amounts</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 text-sm">
          <table className="w-full text-left">
            <thead className="bg-united/20 text-xs uppercase tracking-wider text-white/70">
              <tr>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3 text-right">1st–4th / MOTM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-panel/40 text-white/80">
              <tr>
                <td className="px-4 py-3">Weekly (each league)</td>
                <td className="px-4 py-3 text-right text-gold">
                  {PRIZES.weekly.map((p) => formatNgn(p.amountNgn)).join(" · ")}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">Monthly table (each)</td>
                <td className="px-4 py-3 text-right text-gold">
                  {PRIZES.monthlyTable
                    .map((p) => formatNgn(p.amountNgn))
                    .join(" · ")}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">Manager of the Month</td>
                <td className="px-4 py-3 text-right text-gold">
                  {formatNgn(PRIZES.managerOfTheMonth.classic)} each
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">End of season</td>
                <td className="px-4 py-3 text-right text-gold">
                  {PRIZES.endOfSeason
                    .map((p) => formatNgn(p.amountNgn))
                    .join(" · ")}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">H2H season specials</td>
                <td className="px-4 py-3 text-right text-gold">
                  {PRIZES.h2hSpecials
                    .map((p) => `${p.label} ${formatNgn(p.amountNgn)}`)
                    .join(" · ")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-10 text-sm text-white/50">
        Back to{" "}
        <Link href="/" className="text-gold hover:underline">
          home
        </Link>{" "}
        ·{" "}
        <Link href="/winners" className="text-gold hover:underline">
          winners
        </Link>{" "}
        ·{" "}
        <Link href="/stats" className="text-gold hover:underline">
          glory board / stats
        </Link>
      </p>
    </div>
  );
}

function RuleBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-white/65">{body}</p>
    </div>
  );
}
