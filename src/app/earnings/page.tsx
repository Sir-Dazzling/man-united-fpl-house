export default function EarningsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">Cash board</p>
      <h1 className="mt-2 font-display text-4xl text-white">Who earned the most</h1>
      <p className="mt-3 max-w-2xl text-white/60">
        Season earnings leaderboard built from logged weekly, monthly, and
        end-of-season payouts. Admin records winners after each gameweek.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-united/20 text-xs uppercase tracking-wider text-white/70">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3 text-right">Total earned</th>
            </tr>
          </thead>
          <tbody className="bg-panel/40">
            <tr>
              <td
                colSpan={4}
                className="px-4 py-10 text-center text-white/45"
              >
                No payouts logged yet. Use Admin → Payouts after GW results.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
