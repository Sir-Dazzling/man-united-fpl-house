import { formatNgn } from "@/lib/league-config";

type MotmReadyProps = {
  track: "Classic" | "H2H";
  monthName: string;
  managerName: string;
  teamName: string;
  metricLabel: string;
  metricValue: number;
  amountNgn: number;
  notes?: string;
};

type MotmLockedProps = {
  track: "Classic" | "H2H";
  monthName: string;
  lastGwLabel: string;
  amountNgn: number;
};

export function MotmAwardCard(props: MotmReadyProps) {
  const initials = teamInitials(props.teamName || props.managerName);

  return (
    <article className="motm-card group relative overflow-hidden rounded-2xl">
      <div className="motm-card-bg absolute inset-0" aria-hidden />
      <div className="relative flex min-h-[420px] flex-col justify-between p-6 sm:p-7">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              Manager of the Month
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/55">
              {props.track} · {props.monthName}
            </p>
          </div>
          <span className="rounded-md border border-gold/40 bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold">
            {formatNgn(props.amountNgn)}
          </span>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="motm-crest flex h-28 w-28 items-center justify-center rounded-full border-2 border-gold/50 bg-ink/50 shadow-[0_0_40px_rgba(218,41,28,0.35)]">
            <span className="font-display text-4xl leading-none text-gold">
              {initials}
            </span>
          </div>
          <h2 className="mt-6 max-w-[16ch] font-display text-4xl leading-none text-white sm:text-5xl">
            {props.teamName || "Unknown XI"}
          </h2>
          <p className="mt-3 text-base text-white/70">{props.managerName}</p>
          <p className="mt-4 text-sm tabular-nums text-gold/90">
            {props.metricLabel}{" "}
            <span className="font-semibold text-gold">{props.metricValue}</span>
            {props.notes ? (
              <span className="text-white/40"> · {props.notes}</span>
            ) : null}
          </p>
        </div>

        <footer className="border-t border-white/10 pt-4">
          <p className="text-center text-[11px] uppercase tracking-[0.25em] text-white/45">
            Fan House · GGMU
          </p>
        </footer>
      </div>
    </article>
  );
}

export function MotmLockedCard(props: MotmLockedProps) {
  return (
    <article className="motm-card relative overflow-hidden rounded-2xl">
      <div className="motm-card-bg motm-card-bg--locked absolute inset-0" aria-hidden />
      <div className="relative flex min-h-[420px] flex-col justify-between p-6 sm:p-7">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">
              Manager of the Month
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">
              {props.track} · {props.monthName}
            </p>
          </div>
          <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/45">
            {formatNgn(props.amountNgn)}
          </span>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-white/25 bg-ink/40">
            <span className="font-display text-5xl leading-none text-white/25">?</span>
          </div>
          <h2 className="mt-6 font-display text-4xl leading-none text-white/80 sm:text-5xl">
            Not ready yet
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
            Reveals after the last gameweek of this month (
            <span className="text-gold/80">{props.lastGwLabel}</span>) is finished —
            one winner, Premier League POTM style.
          </p>
        </div>

        <footer className="border-t border-white/10 pt-4">
          <p className="text-center text-[11px] uppercase tracking-[0.25em] text-white/30">
            Locked until month end
          </p>
        </footer>
      </div>
    </article>
  );
}

function teamInitials(name: string): string {
  const parts = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "FH";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
