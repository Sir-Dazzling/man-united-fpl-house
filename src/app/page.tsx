import Link from "next/link";
import Image from "next/image";
import { JoinCodes } from "@/components/JoinCodes";
import { HomeLiveSection } from "@/components/HomeLiveSection";
import { LEAGUE, formatNgn, PRIZES } from "@/lib/league-config";

export default function HomePage() {
  return (
    <div className="hero-glow">
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-8 lg:pt-16">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          Free to join · Classic + H2H
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[0.95] text-white sm:text-6xl md:text-7xl">
          {LEAGUE.name}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/70">
          {LEAGUE.tagline} Weekly cash for the sharp, a roast for whoever bricks
          it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/classic"
            className="rounded-lg bg-united px-5 py-2.5 text-sm font-semibold text-white hover:bg-united/90"
          >
            Classic standings
          </Link>
          <Link
            href="/winners"
            className="rounded-lg border border-gold/40 px-5 py-2.5 text-sm font-semibold text-gold hover:bg-gold/10"
          >
            Winners &amp; fraud
          </Link>
          <Link
            href="/rules"
            className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:border-white/40"
          >
            How we rank
          </Link>
        </div>
      </section>

      <HomeLiveSection />

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="font-display text-3xl text-white">The cash</h2>
        <p className="mt-2 text-sm text-white/55">
          Same pots for Classic and H2H. Cash places follow official FPL
          tie-breaks (still tied → split).{" "}
          <Link href="/rules" className="text-gold hover:underline">
            Full rules →
          </Link>
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MoneyTile
            title="Weekly"
            body="Classic: highest GW Points that week (Transfers break ties, WC/FH excluded). H2H: must win your match, then best margin → Transfers. Top 4 paid."
            amount={`${formatNgn(PRIZES.weekly[0].amountNgn)} → ${formatNgn(PRIZES.weekly[3].amountNgn)}`}
          />
          <MoneyTile
            title="Monthly table"
            body="Top 4 from that calendar month’s gameweeks only — not the season table. Classic: month points sum. H2H: Pts → Pts For → Pts Diff → fewest Pts Against."
            amount={`${formatNgn(PRIZES.monthlyTable[0].amountNgn)} → ${formatNgn(PRIZES.monthlyTable[3].amountNgn)}`}
          />
          <MoneyTile
            title="Manager of the Month"
            body="Same month ranking as monthly #1 — one winner per track. Classic: month GW Points. H2H: month Pts chain (no transfers on H2H table prizes)."
            amount={formatNgn(PRIZES.managerOfTheMonth.classic)}
          />
          <MoneyTile
            title="End of season"
            body="Classic: season Points → Transfers (WC/FH excluded). H2H: season Pts chain + Most Goals Scored / Fewest Goals Conceded specials."
            amount={`${formatNgn(PRIZES.endOfSeason[0].amountNgn)} → ${formatNgn(PRIZES.endOfSeason[3].amountNgn)}`}
          />
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-panel/40 p-5 text-sm text-white/65">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            FPL tie-breaks at a glance
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            <li>
              <strong className="text-white">Classic:</strong> Points → fewest
              Transfers (Wildcard / Free Hit weeks don&apos;t count) → split
            </li>
            <li>
              <strong className="text-white">H2H table / monthly:</strong> Pts →
              Pts For → Pts Diff → fewest Pts Against → split
            </li>
            <li>
              <strong className="text-white">H2H weekly:</strong> win match →
              best margin → Transfers (house weekly format)
            </li>
            <li>
              <strong className="text-white">GW1 lock:</strong> confirmed weekly
              payouts stay final even if rules change later
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <JoinCodes />
        <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-united/20">
          <Image
            src="/posters/man-united-fpl-poster-portrait.png"
            alt="Man United Fan House League announcement poster"
            width={900}
            height={1200}
            className="h-auto w-full"
            priority
          />
        </div>
      </section>
    </div>
  );
}

function MoneyTile({
  title,
  body,
  amount,
}: {
  title: string;
  body: string;
  amount: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="font-display text-xl text-white">{title}</p>
      <p className="mt-2 text-sm text-white/60">{body}</p>
      <p className="mt-4 text-sm font-semibold text-gold">{amount}</p>
    </div>
  );
}
