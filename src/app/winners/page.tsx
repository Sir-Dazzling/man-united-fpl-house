import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentGameweek, getSeasonGameweeks } from "@/lib/fpl/client";
import { PAYOUT_CATEGORIES, formatNgn } from "@/lib/league-config";
import { getSuspendedEntryIds } from "@/lib/suspensions";
import { resolveClassicWeekly, resolveH2hWeekly } from "@/lib/winners";
import { resolveWeeklyForDisplay } from "@/lib/weekly-lock";
import { FraudCard, WinnersPreviewTable } from "@/components/WinnersPreview";
import { PrizeRulesLegend } from "@/components/PrizeRulesLegend";
import { ShareExportBar } from "@/components/ShareExportBar";
import { GameweekBelt } from "@/components/GameweekBelt";

export const dynamic = "force-dynamic";

export default async function WinnersPage({
  searchParams,
}: {
  searchParams: Promise<{ gw?: string }>;
}) {
  const params = await searchParams;
  const [gwInfo, gameweeks] = await Promise.all([
    getCurrentGameweek(),
    getSeasonGameweeks(),
  ]);
  const currentId = gwInfo?.id ?? 1;
  const gw = Number(params.gw ?? currentId);

  const [classic, h2h, confirmedRaw, suspendedClassic, suspendedH2h] =
    await Promise.all([
    resolveWeeklyForDisplay(gw, "classic_weekly", () => resolveClassicWeekly(gw)),
    resolveWeeklyForDisplay(gw, "h2h_weekly", () => resolveH2hWeekly(gw)),
    prisma.payout.findMany({
      where: {
        gameweek: gw,
        category: { in: ["classic_weekly", "h2h_weekly"] },
      },
      orderBy: { amountNgn: "desc" },
    }),
    getSuspendedEntryIds("classic"),
    getSuspendedEntryIds("h2h"),
  ]);

  const confirmed = confirmedRaw.filter((p) => {
    if (!p.entryId) return true;
    if (p.category === "classic_weekly") return !suspendedClassic.has(p.entryId);
    if (p.category === "h2h_weekly") return !suspendedH2h.has(p.entryId);
    return true;
  });

  const label = Object.fromEntries(
    PAYOUT_CATEGORIES.map((c) => [c.value, c.label]),
  );

  const csvRows = [
    ["source", "manager", "detail", "amount", "status"],
    ...classic.winners.map((w) => [
      "classic_preview",
      w.managerName,
      w.placeLabel,
      String(w.amountNgn),
      "preview",
    ]),
    ...h2h.winners.map((w) => [
      "h2h_preview",
      w.managerName,
      w.placeLabel,
      String(w.amountNgn),
      "preview",
    ]),
    ...confirmed.map((p) => [
      p.category,
      p.managerName,
      p.placeLabel,
      String(p.amountNgn),
      p.status,
    ]),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">
            Glory &amp; shame
          </p>
          <h1 className="mt-2 font-display text-4xl text-white">
            Winners · GW{gw}
          </h1>
          <p className="mt-2 text-white/60">
            Live preview from FPL + confirmed payouts from admin.{" "}
            <Link href="/rules" className="text-gold hover:underline">
              How ranking works →
            </Link>
          </p>
        </div>
        <ShareExportBar
          captureId="winners-capture"
          csvFilename={`winners-gw${gw}.csv`}
          csvRows={csvRows}
        />
      </div>

      <div className="mt-6">
        <GameweekBelt
          gameweeks={gameweeks}
          selectedGw={gw}
          pathname="/winners"
        />
      </div>

      <div className="mt-6">
        <PrizeRulesLegend compact />
      </div>

      <div id="winners-capture" className="mt-8 space-y-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <WinnersPreviewTable
            title="Classic podium"
            winners={classic.winners}
            empty={classic.emptyReason ?? "No Classic winners yet."}
          />
          <WinnersPreviewTable
            title="H2H podium"
            winners={h2h.winners}
            empty={h2h.emptyReason ?? "Waiting on H2H match results."}
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <FraudCard title="Classic fraud of the week" fraud={classic.fraud} />
          <FraudCard title="H2H fraud of the week" fraud={h2h.fraud} />
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <div className="border-b border-white/10 bg-united/20 px-4 py-3 font-display text-lg text-white">
          Confirmed payouts · GW{gw}
        </div>
        {confirmed.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-white/45">
            Admin hasn&apos;t confirmed this GW yet.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {confirmed.map((p) => (
              <li
                key={p.id}
                className="flex justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{p.managerName}</p>
                  <p className="text-xs text-white/50">
                    {label[p.category] ?? p.category} · {p.placeLabel} ·{" "}
                    {p.status}
                  </p>
                </div>
                <p className="font-semibold text-gold">
                  {formatNgn(p.amountNgn)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
