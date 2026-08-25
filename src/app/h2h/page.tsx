import { LEAGUE } from "@/lib/league-config";

export default function H2hPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">Head-to-Head</p>
      <h1 className="mt-2 font-display text-4xl text-white">H2H standings</h1>
      <p className="mt-3 max-w-2xl text-white/60">
        W-D-L, points for / against, and weekly form will appear here via{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-gold">
          getH2hStandings()
        </code>
        . Invite code:{" "}
        <span className="font-mono text-white">{LEAGUE.h2h.code}</span>
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {["W-D-L table", "Most goals scored (PF)", "Fewest conceded (PA)"].map(
          (label) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-panel/60 p-6"
            >
              <p className="text-sm text-white/50">{label}</p>
              <p className="mt-3 font-display text-2xl text-white/30">Soon</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
