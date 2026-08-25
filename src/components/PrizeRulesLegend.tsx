import Link from "next/link";

export function PrizeRulesLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel/50 p-4 text-sm text-white/70">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">How places work</p>
      {!compact ? (
        <ul className="mt-3 space-y-1.5 list-disc pl-5">
          <li>
            <strong className="text-white">Classic weekly:</strong> most points that GW
          </li>
          <li>
            <strong className="text-white">H2H weekly:</strong> must win your match, then best
            margin
          </li>
          <li>
            <strong className="text-white">Monthly table:</strong> top of the season table at
            month end (shown only after that month’s last GW is played)
          </li>
          <li>
            <strong className="text-white">MOTM:</strong> one winner per track, revealed after the month’s last GW (Classic points /
            H2H pts then GD)
          </li>
          <li>
            <strong className="text-white">Cash ties:</strong> fewer transfers wins; still tied
            → split
          </li>
          <li>
            <strong className="text-white">Fraud:</strong> banter only — worst week/month (no
            cash)
          </li>
        </ul>
      ) : (
        <p className="mt-2">
          FPL can show tied ranks. Cash uses our tie-breaks.{" "}
          <Link href="/rules" className="text-gold hover:underline">
            Full rules →
          </Link>
        </p>
      )}
      {!compact ? (
        <p className="mt-3">
          <Link href="/rules" className="text-gold hover:underline">
            Read the full rules &amp; algorithms →
          </Link>
        </p>
      ) : null}
    </div>
  );
}
