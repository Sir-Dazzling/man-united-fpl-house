import { CLASSIC_LABELS, EOS_LABELS, H2H_LABELS } from "@/lib/fpl-labels";
import { formatNgn, PRIZES } from "@/lib/league-config";

function ordinal(n: number) {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}

function PlaceRow({
  place,
  amountNgn,
}: {
  place: number;
  amountNgn: number;
}) {
  return (
    <li className="flex items-center justify-between border-b border-white/5 py-2 text-sm last:border-0">
      <span className="text-white/70">
        {place}
        {ordinal(place)}
      </span>
      <span className="font-semibold text-gold">{formatNgn(amountNgn)}</span>
    </li>
  );
}

export function PrizeSummary() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="font-display text-lg text-white">Weekly (Classic)</h3>
        <p className="mt-1 text-xs text-white/45">
          {CLASSIC_LABELS.gwPoints} → {CLASSIC_LABELS.transfers} (WC/FH
          excluded)
        </p>
        <ul className="mt-3">
          {PRIZES.weekly.map((row) => (
            <PlaceRow key={row.place} {...row} />
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="font-display text-lg text-white">Weekly (H2H)</h3>
        <p className="mt-1 text-xs text-white/45">
          Win match → {H2H_LABELS.winMargin.toLowerCase()} →{" "}
          {CLASSIC_LABELS.transfers}
        </p>
        <ul className="mt-3">
          {PRIZES.weekly.map((row) => (
            <PlaceRow key={`h2h-${row.place}`} {...row} />
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="font-display text-lg text-white">Manager of the Month</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-white/70">
              Classic ({CLASSIC_LABELS.monthPoints.toLowerCase()})
            </span>
            <span className="font-semibold text-gold">
              {formatNgn(PRIZES.managerOfTheMonth.classic)}
            </span>
          </li>
          <li className="flex justify-between">
            <span className="text-white/70">
              H2H ({H2H_LABELS.pts} → {H2H_LABELS.ptsFor} → {H2H_LABELS.ptsDiff})
            </span>
            <span className="font-semibold text-gold">
              {formatNgn(PRIZES.managerOfTheMonth.h2h)}
            </span>
          </li>
        </ul>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="font-display text-lg text-white">Monthly table (both)</h3>
        <p className="mt-1 text-xs text-white/45">
          Month-only stats · same FPL tie-breaks as MOTM · top 4 paid
        </p>
        <ul className="mt-3">
          {PRIZES.monthlyTable.map((row) => (
            <PlaceRow key={`month-${row.place}`} {...row} />
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="font-display text-lg text-white">End of Season (Both)</h3>
        <p className="mt-1 text-xs text-white/45">
          Classic: {CLASSIC_LABELS.points} → {CLASSIC_LABELS.transfers}. H2H:{" "}
          {H2H_LABELS.pts} chain
        </p>
        <ul className="mt-3">
          {PRIZES.endOfSeason.map((row) => (
            <PlaceRow key={`eos-${row.place}`} {...row} />
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-united/40 bg-united/10 p-5 md:col-span-2">
        <h3 className="font-display text-lg text-white">H2H Specials</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {PRIZES.h2hSpecials.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between rounded-lg bg-ink/40 px-3 py-2 text-sm"
            >
              <span className="text-white/80">
                {row.id === "most-goals-scored"
                  ? `${EOS_LABELS.mostGoalsScored} (${H2H_LABELS.ptsFor})`
                  : `${EOS_LABELS.fewestGoalsConceded} (${H2H_LABELS.ptsAgainst})`}
              </span>
              <span className="font-semibold text-gold">
                {formatNgn(row.amountNgn)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
