import Image from "next/image";
import { formatNgn } from "@/lib/league-config";
import type { ResolvedWinner } from "@/lib/winners";

function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function ClubBadge({
  badgeUrl,
  name,
  size = 40,
}: {
  badgeUrl?: string | null;
  name: string;
  size?: number;
}) {
  if (badgeUrl) {
    return (
      <Image
        src={badgeUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-white/20 bg-ink/50 font-display text-gold"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      aria-hidden
    >
      {teamInitials(name)}
    </div>
  );
}

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
              <div className="flex min-w-0 items-start gap-3">
                <ClubBadge
                  badgeUrl={w.badgeUrl}
                  name={w.teamName || w.managerName}
                />
                <div className="min-w-0">
                  <p className="font-medium text-white">{w.managerName}</p>
                  <p className="text-xs text-white/50">
                    {w.teamName} · {w.placeLabel} · {w.metricLabel}{" "}
                    {w.metricValue} · {w.transfersUsed} tr
                    {w.notes ? ` · ${w.notes}` : ""}
                  </p>
                </div>
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
    badgeUrl?: string | null;
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
          {fraud.map((f, index) => (
            <li
              key={`${f.entryId}-${f.roast}-${index}`}
              className="flex items-start gap-3"
            >
              <ClubBadge
                badgeUrl={f.badgeUrl}
                name={f.teamName || f.managerName}
                size={compact ? 40 : 48}
              />
              <div className="min-w-0">
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
