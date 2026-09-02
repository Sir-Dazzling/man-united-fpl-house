import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentGameweek, getSeasonGameweeks } from "@/lib/fpl/client";
import {
  confirmClassicWeeklyAndRedirect,
  confirmH2hWeeklyAndRedirect,
  markClassicWeeklyPaidAndRedirect,
  markH2hWeeklyPaidAndRedirect,
} from "@/lib/confirm-actions";
import { resolveClassicWeekly, resolveH2hWeekly } from "@/lib/winners";
import { resolveWeeklyForDisplay } from "@/lib/weekly-lock";
import type { PayoutWorkflowRow } from "@/lib/payout-workflow";
import { AdminFlashBanner } from "@/components/AdminFlashBanner";
import { AdminPayoutWorkflow } from "@/components/AdminPayoutWorkflow";
import { FraudCard, WinnersPreviewTable } from "@/components/WinnersPreview";
import { PrizeRulesLegend } from "@/components/PrizeRulesLegend";
import { ShareExportBar } from "@/components/ShareExportBar";
import { GameweekBelt } from "@/components/GameweekBelt";

export const dynamic = "force-dynamic";

export default async function AdminGameweekPage({
  searchParams,
}: {
  searchParams: Promise<{ gw?: string; msg?: string; ok?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/gameweek");
  }

  const params = await searchParams;
  const [current, gameweeks] = await Promise.all([
    getCurrentGameweek(),
    getSeasonGameweeks(),
  ]);
  const gw = Number(params.gw ?? current?.id ?? 1);

  const [classic, h2h, payouts] = await Promise.all([
    resolveWeeklyForDisplay(gw, "classic_weekly", () => resolveClassicWeekly(gw)),
    resolveWeeklyForDisplay(gw, "h2h_weekly", () => resolveH2hWeekly(gw)),
    prisma.payout.findMany({
      where: {
        gameweek: gw,
        category: { in: ["classic_weekly", "h2h_weekly"] },
      },
      orderBy: [{ amountNgn: "desc" }],
    }),
  ]);

  const hasClassic = classic.winners.length > 0;
  const hasH2h = h2h.winners.length > 0;

  const classicPayouts = mapPayoutRows(
    payouts.filter((p) => p.category === "classic_weekly"),
  );
  const h2hPayouts = mapPayoutRows(
    payouts.filter((p) => p.category === "h2h_weekly"),
  );

  const csvRows = [
    ["league", "place", "manager", "team", "metric", "value", "transfers", "amount"],
    ...classic.winners.map((w) => [
      "classic",
      w.placeLabel,
      w.managerName,
      w.teamName,
      w.metricLabel,
      String(w.metricValue),
      String(w.transfersUsed),
      String(w.amountNgn),
    ]),
    ...h2h.winners.map((w) => [
      "h2h",
      w.placeLabel,
      w.managerName,
      w.teamName,
      w.metricLabel,
      String(w.metricValue),
      String(w.transfersUsed),
      String(w.amountNgn),
    ]),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Admin</p>
          <h1 className="mt-2 font-display text-4xl text-white">
            Gameweek desk
          </h1>
          <p className="mt-2 text-white/60">
            Preview winners → confirm &amp; announce → mark paid when money is
            sent.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <GameweekBelt
          gameweeks={gameweeks}
          selectedGw={gw}
          pathname="/admin/gameweek"
        />
      </div>

      {params.msg ? (
        <AdminFlashBanner
          message={params.msg}
          ok={params.ok !== "0"}
        />
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <PrizeRulesLegend compact />
        <ShareExportBar
          captureId="gw-desk-capture"
          csvFilename={`gw${gw}-winners.csv`}
          csvRows={csvRows}
        />
      </div>

      <div id="gw-desk-capture" className="mt-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <WinnersPreviewTable
              title={`Classic weekly · GW${gw}`}
              winners={classic.winners}
              empty={classic.emptyReason ?? "No Classic winners yet."}
            />
            {hasClassic ? (
              <FraudCard
                title="Classic fraud of the week"
                fraud={classic.fraud}
              />
            ) : (
              <EmptyDeskNote
                text={classic.emptyReason ?? "Nothing to confirm for Classic."}
              />
            )}
            {hasClassic ? (
              <AdminPayoutWorkflow
                trackLabel={`Classic weekly · GW${gw}`}
                gameweek={gw}
                category="classic_weekly"
                payouts={classicPayouts}
                confirmAction={confirmClassicWeeklyAndRedirect}
                markPaidAction={markClassicWeeklyPaidAndRedirect}
              />
            ) : null}
          </div>

          <div className="space-y-4">
            <WinnersPreviewTable
              title={`H2H weekly · GW${gw}`}
              winners={h2h.winners}
              empty={
                h2h.emptyReason ??
                "No H2H winners yet (need finished matches + wins)."
              }
            />
            {hasH2h ? (
              <FraudCard title="H2H fraud of the week" fraud={h2h.fraud} />
            ) : (
              <EmptyDeskNote
                text={h2h.emptyReason ?? "Nothing to confirm for H2H."}
              />
            )}
            {hasH2h ? (
              <AdminPayoutWorkflow
                trackLabel={`H2H weekly · GW${gw}`}
                gameweek={gw}
                category="h2h_weekly"
                payouts={h2hPayouts}
                confirmAction={confirmH2hWeeklyAndRedirect}
                markPaidAction={markH2hWeeklyPaidAndRedirect}
              />
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-white/50">
        Month-end table + MOTM confirm lives on{" "}
        <Link href="/motm" className="text-gold hover:underline">
          /motm
        </Link>
        . End of season on{" "}
        <Link href="/admin/eos" className="text-gold hover:underline">
          /admin/eos
        </Link>
        . Manual edits on{" "}
        <Link href="/admin/payouts" className="text-gold hover:underline">
          /admin/payouts
        </Link>
        .{" "}
        <Link href="/admin/suspensions" className="text-gold hover:underline">
          Suspend manager
        </Link>
        .
      </p>
    </div>
  );
}

function mapPayoutRows(
  rows: Array<{
    id: string;
    managerName: string;
    placeLabel: string;
    amountNgn: number;
    status: string;
    paidAt: Date | null;
  }>,
): PayoutWorkflowRow[] {
  return rows.map((p) => ({
    id: p.id,
    managerName: p.managerName,
    placeLabel: p.placeLabel,
    amountNgn: p.amountNgn,
    status: p.status,
    paidAt: p.paidAt,
  }));
}

function EmptyDeskNote({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-panel/30 px-4 py-6 text-sm text-white/50">
      {text}
    </div>
  );
}
