import Image from "next/image";
import Link from "next/link";
import { JoinCodes } from "@/components/JoinCodes";
import { PrizeSummary } from "@/components/PrizeSummary";
import { LEAGUE } from "@/lib/league-config";

export default function HomePage() {
  return (
    <div className="hero-glow">
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            100% free to enter
          </p>
          <h1 className="mt-3 font-display text-5xl leading-none text-white sm:text-6xl md:text-7xl">
            {LEAGUE.name}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/70">{LEAGUE.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/classic"
              className="rounded-lg bg-united px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-united/90"
            >
              Classic standings
            </Link>
            <Link
              href="/h2h"
              className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-gold/50 hover:text-gold"
            >
              H2H standings
            </Link>
            <Link
              href="/earnings"
              className="rounded-lg border border-gold/40 px-5 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10"
            >
              Earnings board
            </Link>
          </div>
        </div>
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

      <section className="mx-auto max-w-6xl space-y-10 px-4 pb-16">
        <JoinCodes />
        <div>
          <h2 className="font-display text-3xl text-white">Prize pool</h2>
          <p className="mt-2 text-sm text-white/55">
            Weekly, monthly, and end-of-season payouts for Classic and H2H.
          </p>
          <div className="mt-6">
            <PrizeSummary />
          </div>
        </div>
      </section>
    </div>
  );
}
