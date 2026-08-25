import { ordinal } from "@/lib/league-config";

type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  className?: string;
  render: (row: T) => React.ReactNode;
};

export function StandingsTable<
  T extends { id: number | string; entry?: number | string },
>({
  columns,
  rows,
  emptyMessage = "No standings yet.",
}: {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-panel/60 px-6 py-12 text-center text-white/50">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-united/20 text-xs uppercase tracking-wider text-white/70">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-medium ${alignClass(col.align)} ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-panel/40">
          {rows.map((row, index) => (
            <tr
              key={`${row.entry ?? row.id}-${index}`}
              className="transition hover:bg-white/5"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-white/90 ${alignClass(col.align)} ${col.className ?? ""}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankDelta({
  rank,
  lastRank,
}: {
  rank: number;
  lastRank: number;
}) {
  if (!lastRank || lastRank === 0) {
    return (
      <span className="text-base text-white/35" aria-label="No previous rank">
        —
      </span>
    );
  }
  const delta = lastRank - rank;
  if (delta === 0) {
    return (
      <span className="text-base text-white/40" aria-label="No change">
        ·
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-base font-semibold tabular-nums text-emerald-400"
        aria-label={`Up ${delta} place${delta === 1 ? "" : "s"}`}
      >
        <span aria-hidden>↑</span>
        {delta}
      </span>
    );
  }
  const dropped = Math.abs(delta);
  return (
    <span
      className="inline-flex items-center gap-0.5 text-base font-semibold tabular-nums text-red-400"
      aria-label={`Down ${dropped} place${dropped === 1 ? "" : "s"}`}
    >
      <span aria-hidden>↓</span>
      {dropped}
    </span>
  );
}

export function RankBadge({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? "text-gold"
      : rank === 2
        ? "text-white"
        : rank === 3
          ? "text-amber-600"
          : "text-white/80";
  return (
    <span className={`font-semibold tabular-nums ${tone}`}>
      {rank}
      {ordinal(rank)}
    </span>
  );
}

function alignClass(align?: "left" | "right" | "center") {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}
