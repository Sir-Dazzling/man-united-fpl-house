import Link from "next/link";
import { LEAGUE } from "@/lib/league-config";
import { PrizeSummary } from "@/components/PrizeSummary";

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">House law</p>
      <h1 className="mt-2 font-display text-4xl text-white">
        Rules &amp; ranking algorithms
      </h1>
      <p className="mt-3 text-white/60">
        Cash places follow official FPL mini-league tie-breaks. Still tied after
        all FPL rules → split evenly. H2H weekly cash is the one house-format
        exception (win + margin).
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
            <strong className="text-white">Suspensions:</strong> DQ&apos;d managers
            are hidden from standings and winners but still appear on H2H fixtures
            (with a badge).
          </li>
          <li>
            <strong className="text-white">Classic tie-break:</strong> Points →
            fewest Transfers (Wildcard / Free Hit weeks excluded) → split.
          </li>
          <li>
            <strong className="text-white">H2H tie-break:</strong> Pts → Pts For →
            Pts Diff → fewest Pts Against → split.
          </li>
          <li>
            <strong className="text-white">GW1 lock:</strong> GW1 weekly winners
            confirmed and paid under prior rules remain final.
          </li>
          <li>
            <strong className="text-white">VAR:</strong> FPL deadlines are law.
            Admin edge cases are final.
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
          body="Highest GW Points that gameweek. Top 4 paid. Tie-break: Transfers that GW (WC/FH excluded) → split."
        />
        <RuleBlock
          title="Monthly table (cash)"
          body="After the last finished GW of the calendar month, rank managers by GW Points summed only across that month's gameweeks. Top 4 paid. Tie-break: Transfers in those GWs only (WC/FH excluded) → split. Hidden until the month's last GW has been played."
        />
        <RuleBlock
          title="Manager of the Month (cash)"
          body="Same month ranking as monthly table #1 — highest month points sum wins ₦10k."
        />
        <RuleBlock
          title="End of season (cash)"
          body="Season Points → fewest Transfers through GW38 (WC/FH excluded) → split. Top 4 paid."
        />
        <RuleBlock
          title="Fraud of the week / month (banter)"
          body="Lowest GW Points (week) or lowest month points sum (month). No cash — just shame. Tie → more transfers = bigger fraud."
        />
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-2xl text-white">H2H algorithms</h2>
        <RuleBlock
          title="Weekly (cash)"
          body="You must win your H2H match that GW. Among winners, best win margin (your score − opponent). Top 4 paid. Tie on margin → Transfers → split. Draws/losses are out."
        />
        <RuleBlock
          title="Monthly table (cash)"
          body="Stats from that month's H2H matches only: Pts (3/1/0) → Pts For → Pts Diff → fewest Pts Against → split. Top 4 paid after the month's last GW."
        />
        <RuleBlock
          title="Manager of the Month (cash)"
          body="Same month H2H ranking as monthly table #1 — ₦10k to 1st."
        />
        <RuleBlock
          title="End of season (cash)"
          body="Season H2H table: Pts → Pts For → Pts Diff → fewest Pts Against → split. Top 4 paid. Specials: Most Goals Scored (highest Pts For) and Fewest Goals Conceded (lowest Pts Against), ₦10k each."
        />
        <RuleBlock
          title="Fraud of the week / month (banter)"
          body="Week: worst loss margin among losers. Month: fewest H2H Pts, then worst Pts Diff. No cash."
        />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-white">Prize amounts</h2>
        <p className="mt-2 text-sm text-white/55">
          Amounts below include tie-break notes per track. Still tied after FPL
          rules → split evenly.
        </p>
        <div className="mt-4">
          <PrizeSummary />
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
