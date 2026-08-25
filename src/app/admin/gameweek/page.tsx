import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentGameweek, getSeasonGameweeks } from "@/lib/fpl/client";
import {
  confirmClassicWeeklyAction,
  confirmH2hWeeklyAction,
  markWeeklyPaidAction,
} from "@/lib/confirm-actions";
import { resolveClassicWeekly, resolveH2hWeekly } from "@/lib/winners";
import { FraudCard, WinnersPreviewTable } from "@/components/WinnersPreview";
import { PrizeRulesLegend } from "@/components/PrizeRulesLegend";
import { ShareExportBar } from "@/components/ShareExportBar";
import { GameweekBelt } from "@/components/GameweekBelt";

export const dynamic = "force-dynamic";

export default async function AdminGameweekPage({
  searchParams,
}: {
  searchParams: Promise<{ gw?: string; msg?: string }>;
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

  const [classic, h2h] = await Promise.all([
    resolveClassicWeekly(gw),
    resolveH2hWeekly(gw),
  ]);

  const hasClassic = classic.winners.length > 0;
  const hasH2h = h2h.winners.length > 0;

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
            Preview → confirm winners → mark paid. Fraud is banter only.
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
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          {params.msg}
        </p>
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
              <div className="flex flex-wrap gap-2" data-export-exclude>
                <form
                  action={async (fd) => {
                    "use server";
                    fd.set("gameweek", String(gw));
                    const res = await confirmClassicWeeklyAction(fd);
                    redirect(
                      `/admin/gameweek?gw=${gw}&msg=${encodeURIComponent(res.message)}`,
                    );
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-lg bg-united px-4 py-2 text-sm font-semibold text-white"
                  >
                    Confirm Classic winners
                  </button>
                </form>
                <form
                  action={async (fd) => {
                    "use server";
                    fd.set("gameweek", String(gw));
                    fd.set("category", "classic_weekly");
                    const res = await markWeeklyPaidAction(fd);
                    redirect(
                      `/admin/gameweek?gw=${gw}&msg=${encodeURIComponent(res.message)}`,
                    );
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-lg border border-gold/40 px-4 py-2 text-sm font-semibold text-gold"
                  >
                    Mark Classic paid
                  </button>
                </form>
              </div>
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
              <div className="flex flex-wrap gap-2" data-export-exclude>
                <form
                  action={async (fd) => {
                    "use server";
                    fd.set("gameweek", String(gw));
                    const res = await confirmH2hWeeklyAction(fd);
                    redirect(
                      `/admin/gameweek?gw=${gw}&msg=${encodeURIComponent(res.message)}`,
                    );
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-lg bg-united px-4 py-2 text-sm font-semibold text-white"
                  >
                    Confirm H2H winners
                  </button>
                </form>
                <form
                  action={async (fd) => {
                    "use server";
                    fd.set("gameweek", String(gw));
                    fd.set("category", "h2h_weekly");
                    const res = await markWeeklyPaidAction(fd);
                    redirect(
                      `/admin/gameweek?gw=${gw}&msg=${encodeURIComponent(res.message)}`,
                    );
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-lg border border-gold/40 px-4 py-2 text-sm font-semibold text-gold"
                  >
                    Mark H2H paid
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-white/50">
        Month-end table + MOTM confirm lives on{" "}
        <Link href="/motm" className="text-gold hover:underline">
          /motm
        </Link>
        . Manual edits on{" "}
        <Link href="/admin/payouts" className="text-gold hover:underline">
          /admin/payouts
        </Link>
        .
      </p>
    </div>
  );
}

function EmptyDeskNote({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-panel/30 px-4 py-6 text-sm text-white/50">
      {text}
    </div>
  );
}
