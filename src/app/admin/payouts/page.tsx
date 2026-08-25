import { formatNgn, PRIZES } from "@/lib/league-config";

export default function AdminPayoutsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">Admin</p>
      <h1 className="mt-2 font-display text-4xl text-white">Log payouts</h1>
      <p className="mt-3 text-white/60">
        Placeholder form — next step is persistence (DB) so earnings and weekly
        winners stick across refreshes.
      </p>

      <form className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-panel/60 p-6">
        <Field label="Gameweek">
          <input
            type="number"
            min={1}
            max={38}
            placeholder="e.g. 1"
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
            disabled
          />
        </Field>
        <Field label="League">
          <select
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
            disabled
          >
            <option>Classic weekly</option>
            <option>H2H weekly</option>
            <option>Manager of the Month (Classic)</option>
            <option>Manager of the Month (H2H)</option>
            <option>End of season</option>
            <option>H2H special</option>
          </select>
        </Field>
        <Field label="Place / award">
          <select
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
            disabled
          >
            {PRIZES.weekly.map((row) => (
              <option key={row.place}>
                {row.place}
                {ordinal(row.place)} — {formatNgn(row.amountNgn)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Manager / entry name">
          <input
            type="text"
            placeholder="FPL team or manager name"
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
            disabled
          />
        </Field>
        <Field label="Amount (₦)">
          <input
            type="number"
            placeholder="5000"
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
            disabled
          />
        </Field>
        <button
          type="button"
          disabled
          className="w-full rounded-lg bg-united/50 px-4 py-2.5 text-sm font-semibold text-white/70"
        >
          Save payout (coming next)
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-wider text-white/50">
        {label}
      </span>
      {children}
    </label>
  );
}

function ordinal(n: number) {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}
