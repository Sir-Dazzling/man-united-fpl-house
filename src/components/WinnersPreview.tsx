import { formatNgn } from "@/lib/league-config";
import type { ResolvedWinner } from "@/lib/winners";

export function WinnersPreviewTable({
  title,
  winners,
  empty = "No winners yet.",
}: {
  title: string;
  winners: ResolvedWinner[];
  empty?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel/40 overflow-hidden">
      <div className="border-b border-white/10 bg-united/20 px-4 py-3 font-display text-lg text-white">
        {title}
      </div>
      {winners.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-white/45">{empty}</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {winners.map((w) => (
            <li
              key={`${w.entryId}-${w.placeLabel}-${w.amountNgn}`}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium text-white">{w.managerName}</p>
                <p className="text-xs text-white/50">
                  {w.teamName} · {w.placeLabel} · {w.metricLabel}{" "}
                  {w.metricValue} · {w.transfersUsed} tr
                  {w.notes ? ` · ${w.notes}` : ""}
                </p>
              </div>
              <p className="shrink-0 font-semibold text-gold">
                {formatNgn(w.amountNgn)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FraudCard({
  title,
  fraud,
  compact = false,
}: {
  title: string;
  fraud: Array<{
    entryId: number;
    managerName: string;
    teamName: string;
    roast: string;
    metricLabel?: string;
    metricValue?: number;
    transfersUsed?: number;
  }>;
  /** Home-style: manager + team + roast only */
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink/60 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-red-400">{title}</p>
      {fraud.length === 0 ? (
        <p className="mt-3 text-sm text-white/45">Nobody to roast… yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {fraud.map((f) => (
            <li key={f.entryId}>
              <p className="font-display text-2xl text-white">{f.managerName}</p>
              {f.teamName ? (
                <p className="text-sm text-white/55">{f.teamName}</p>
              ) : null}
              {!compact &&
              f.metricLabel != null &&
              f.metricValue != null &&
              f.transfersUsed != null ? (
                <p className="text-sm text-white/45">
                  {f.metricLabel} {f.metricValue} · {f.transfersUsed} tr
                </p>
              ) : null}
              <p className="mt-1 text-sm text-red-300/90">{f.roast}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
