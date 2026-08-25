import { LEAGUE } from "@/lib/league-config";

export function JoinCodes() {
  return (
    <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/15 to-transparent p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">
        Join both leagues
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <CodeCard label="Classic" code={LEAGUE.classic.code} />
        <CodeCard label="H2H" code={LEAGUE.h2h.code} />
      </div>
      <p className="mt-4 text-sm text-white/60">
        Codes are case-sensitive. Group members &amp; true Reds only.
      </p>
    </div>
  );
}

function CodeCard({ label, code }: { label: string; code: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink/60 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-white">
        {code}
      </p>
    </div>
  );
}
