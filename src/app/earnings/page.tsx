import { prisma } from "@/lib/db";
import { formatNgn } from "@/lib/league-config";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const payouts = await prisma.payout.findMany();

  type Agg = {
    managerName: string;
    total: number;
    paid: number;
    outstanding: number;
    count: number;
  };

  const byManager = new Map<string, Agg>();

  for (const p of payouts) {
    const key = p.managerName.trim().toLowerCase();
    const existing = byManager.get(key) ?? {
      managerName: p.managerName,
      total: 0,
      paid: 0,
      outstanding: 0,
      count: 0,
    };
    existing.total += p.amountNgn;
    existing.count += 1;
    if (p.status === "paid") existing.paid += p.amountNgn;
    else existing.outstanding += p.amountNgn;
    byManager.set(key, existing);
  }

  const rows = [...byManager.values()].sort((a, b) => b.total - a.total);
  const potTotal = rows.reduce((s, r) => s + r.total, 0);
  const potPaid = rows.reduce((s, r) => s + r.paid, 0);
  const potOut = rows.reduce((s, r) => s + r.outstanding, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">Cash board</p>
      <h1 className="mt-2 font-display text-4xl text-white">
        Who earned the most
      </h1>
      <p className="mt-3 max-w-2xl text-white/60">
        From confirmed payouts logged by the league admin.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Total earned" value={formatNgn(potTotal)} />
        <Stat label="Paid out" value={formatNgn(potPaid)} />
        <Stat label="Outstanding" value={formatNgn(potOut)} />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-united/20 text-xs uppercase tracking-wider text-white/70">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-panel/40">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-white/45"
                >
                  No payouts logged yet.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.managerName} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-semibold text-gold">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-white">{row.managerName}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-400/90">
                    {formatNgn(row.paid)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/70">
                    {formatNgn(row.outstanding)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-gold">
                    {formatNgn(row.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-white/45">{label}</p>
      <p className="mt-1 font-display text-2xl text-gold">{value}</p>
    </div>
  );
}
