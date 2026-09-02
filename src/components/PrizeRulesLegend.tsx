import Link from "next/link";

export function PrizeRulesLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel/50 p-4 text-sm text-white/70">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">How places work</p>
      {!compact ? (
        <ul className="mt-3 space-y-1.5 list-disc pl-5">
          <li>
            <strong className="text-white">Classic weekly:</strong> GW Points →
            Transfers (WC/FH excluded) → split
          </li>
          <li>
            <strong className="text-white">H2H weekly:</strong> must win your
            match, then best margin → transfers → split (house format)
          </li>
          <li>
            <strong className="text-white">Monthly table:</strong> stats from
            that month&apos;s GWs only — Classic: month points; H2H: Pts → Pts
            For → Pts Diff → fewest Pts Against → split
          </li>
          <li>
            <strong className="text-white">MOTM:</strong> same month ranking as
            monthly #1; pays ₦10k to 1st only
          </li>
          <li>
            <strong className="text-white">End of season:</strong> season totals
            with official FPL tie-breaks (Classic: Points → Transfers; H2H: Pts
            chain above)
          </li>
          <li>
            <strong className="text-white">GW1 lock:</strong> confirmed/paid
            weekly results stay final even if rules change later
          </li>
          <li>
            <strong className="text-white">Fraud:</strong> banter only — worst
            week/month (no cash)
          </li>
        </ul>
      ) : (
        <p className="mt-2">
          Cash uses official FPL tie-breaks (still tied → split). Season tallies
          on{" "}
          <Link href="/stats" className="text-gold hover:underline">
            Stats
          </Link>
          .{" "}
          <Link href="/rules" className="text-gold hover:underline">
            Full rules →
          </Link>
        </p>
      )}
      {!compact ? (
        <p className="mt-3">
          Season tallies (MOTW, podiums, MOTM, fraud) live on{" "}
          <Link href="/stats" className="text-gold hover:underline">
            Stats / Glory Board
          </Link>
          .{" "}
          <Link href="/rules" className="text-gold hover:underline">
            Read the full rules &amp; algorithms →
          </Link>
        </p>
      ) : null}
    </div>
  );
}
