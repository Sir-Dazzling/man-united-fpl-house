import Image from "next/image";
import { formatNgn } from "@/lib/league-config";

export type MotmStat = {
  label: string;
  value: string;
  /** Emphasize as the hero number */
  accent?: boolean;
};

type MotmReadyProps = {
  track: "Classic" | "H2H";
  monthName: string;
  managerName: string;
  teamName: string;
  amountNgn: number;
  badgeUrl?: string | null;
  /** Short line under the name, e.g. "Cleared the field by 14 pts" */
  headline?: string;
  stats: MotmStat[];
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
  const hero = props.stats.find((s) => s.accent) ?? props.stats[0];
  const rest = props.stats.filter((s) => s !== hero);

  return (
    <article className="motm-card group relative overflow-hidden rounded-2xl">
      <div className="motm-card-bg absolute inset-0" aria-hidden />
      <div className="relative flex min-h-[480px] flex-col justify-between p-6 sm:p-7">
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

        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          {props.badgeUrl ? (
            <Image
              src={props.badgeUrl}
              alt=""
              width={112}
              height={112}
              className="motm-crest h-28 w-28 object-contain drop-shadow-[0_0_28px_rgba(218,41,28,0.45)]"
            />
          ) : (
            <div className="motm-crest flex h-28 w-28 items-center justify-center rounded-full border-2 border-gold/50 bg-ink/50 shadow-[0_0_40px_rgba(218,41,28,0.35)]">
              <span className="font-display text-4xl leading-none text-gold">
                {initials}
              </span>
            </div>
          )}
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.35em] text-gold/80">
            Champion
          </p>
          <h2 className="mt-2 max-w-[18ch] font-display text-4xl leading-none text-white sm:text-5xl">
            {props.teamName || "Unknown XI"}
          </h2>
          <p className="mt-3 text-base text-white/70">{props.managerName}</p>
          {props.headline ? (
            <p className="mt-3 max-w-sm text-sm leading-snug text-gold/90">
              {props.headline}
            </p>
          ) : null}

          {hero ? (
            <div className="mt-6 rounded-xl border border-gold/25 bg-ink/35 px-6 py-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">
                {hero.label}
              </p>
              <p className="mt-1 font-display text-4xl tabular-nums text-gold">
                {hero.value}
              </p>
            </div>
          ) : null}

          {rest.length > 0 ? (
            <dl className="mt-5 grid w-full max-w-md grid-cols-2 gap-2 sm:grid-cols-3">
              {rest.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2"
                >
                  <dt className="text-[10px] uppercase tracking-wider text-white/40">
                    {stat.label}
                  </dt>
                  <dd className="mt-0.5 font-display text-lg tabular-nums text-white">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {props.notes ? (
            <p className="mt-4 text-xs text-white/40">{props.notes}</p>
          ) : null}
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
      <div className="relative flex min-h-[480px] flex-col justify-between p-6 sm:p-7">
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
