import Link from "next/link";
import { LEAGUE } from "@/lib/league-config";

export default function ClassicPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">Classic</p>
      <h1 className="mt-2 font-display text-4xl text-white">League standings</h1>
      <p className="mt-3 max-w-2xl text-white/60">
        Live Classic rankings will load from the FPL API once{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-gold">
          LEAGUE.classic.leagueId
        </code>{" "}
        is set in config. Invite code:{" "}
        <span className="font-mono text-white">{LEAGUE.classic.code}</span>
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-panel/60 p-8 text-center">
        <p className="text-white/70">
          Standings table placeholder — wire{" "}
          <code className="font-mono text-sm text-gold">getClassicStandings()</code>{" "}
          after resolving the numeric league ID from FPL.
        </p>
        <Link
          href="/admin/payouts"
          className="mt-4 inline-block text-sm text-gold underline-offset-4 hover:underline"
        >
          Log weekly payouts →
        </Link>
      </div>
    </div>
  );
}
