import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  confirmClassicEosAndRedirect,
  confirmH2hEosAndRedirect,
  confirmH2hSpecialsAndRedirect,
  markEosPaidAndRedirect,
} from "@/lib/confirm-actions";
import {
  getCurrentGameweek,
  getFinishedGameweeks,
  getSeasonGameweeks,
} from "@/lib/fpl/client";
import {
  resolveClassicEos,
  resolveH2hEos,
  resolveH2hSpecials,
} from "@/lib/winners";
import type { PayoutWorkflowRow } from "@/lib/payout-workflow";
import { AdminFlashBanner } from "@/components/AdminFlashBanner";
import { AdminPayoutWorkflow } from "@/components/AdminPayoutWorkflow";
import { WinnersPreviewTable } from "@/components/WinnersPreview";
import { PrizeRulesLegend } from "@/components/PrizeRulesLegend";
import { formatNgn, PRIZES } from "@/lib/league-config";

export const dynamic = "force-dynamic";

export default async function AdminEosPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; ok?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/eos");
  }

  const params = await searchParams;
  const [current, finished, allGws] = await Promise.all([
    getCurrentGameweek(),
    getFinishedGameweeks(),
    getSeasonGameweeks(),
  ]);

  const throughGw =
    current?.finished === true
      ? (current.id ?? 1)
      : (finished.at(-1)?.id ?? 1);
  const lastGwId = allGws.at(-1)?.id ?? 38;
  const seasonComplete =
    finished.length > 0 &&
    finished.length >= allGws.length &&
    (finished.at(-1)?.id ?? 0) >= lastGwId;

  const [classic, h2h, specials, payouts] = await Promise.all([
    resolveClassicEos(throughGw),
    resolveH2hEos(throughGw),
    resolveH2hSpecials(throughGw),
    prisma.payout.findMany({
      where: {
        gameweek: throughGw,
        category: { in: ["classic_eos", "h2h_eos", "h2h_special"] },
      },
      orderBy: [{ amountNgn: "desc" }],
    }),
  ]);

  const classicPayouts = mapPayoutRows(
    payouts.filter((p) => p.category === "classic_eos"),
  );
  const h2hPayouts = mapPayoutRows(
    payouts.filter((p) => p.category === "h2h_eos"),
  );
  const specialPayouts = mapPayoutRows(
    payouts.filter((p) => p.category === "h2h_special"),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Admin</p>
          <h1 className="mt-2 font-display text-4xl text-white">
            End of season desk
          </h1>
          <p className="mt-2 text-white/60">
            Live preview through GW{throughGw}
            {seasonComplete
              ? " · season complete — confirm & pay when ready"
              : " · confirm unlocks after the final gameweek finishes"}
            .
          </p>
        </div>
        <Link
          href="/admin/suspensions"
          className="text-sm text-gold hover:underline"
        >
          Suspend managers →
        </Link>
      </div>

      {params.msg ? (
        <AdminFlashBanner message={params.msg} ok={params.ok !== "0"} />
      ) : null}

      <div className="mt-6">
        <PrizeRulesLegend compact />
      </div>

      {!seasonComplete ? (
        <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100/90">
          Season still in progress (finished {finished.length}/{allGws.length}{" "}
          GWs). Preview below uses FPL standings through GW{throughGw}. Confirm
          buttons stay locked until the last GW is finished.
        </div>
      ) : null}

      <div className="mt-8 space-y-10">
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <WinnersPreviewTable
              title={`Classic EOS · ${formatNgn(PRIZES.endOfSeason[0].amountNgn)}–${formatNgn(PRIZES.endOfSeason[3].amountNgn)}`}
              winners={classic.winners}
              empty="No Classic standings yet."
            />
            {seasonComplete ? (
              <AdminPayoutWorkflow
                trackLabel={`Classic end of season · GW${throughGw}`}
                gameweek={throughGw}
                category="classic_eos"
                payouts={classicPayouts}
                confirmAction={confirmClassicEosAndRedirect}
                confirmHiddenFields={{ throughGw }}
                markPaidAction={markEosPaidAndRedirect}
              />
            ) : (
              <LockedConfirmNote />
            )}
          </div>
          <div className="space-y-4">
            <WinnersPreviewTable
              title={`H2H EOS · ${formatNgn(PRIZES.endOfSeason[0].amountNgn)}–${formatNgn(PRIZES.endOfSeason[3].amountNgn)}`}
              winners={h2h.winners}
              empty="No H2H standings yet."
            />
            {seasonComplete ? (
              <AdminPayoutWorkflow
                trackLabel={`H2H end of season · GW${throughGw}`}
                gameweek={throughGw}
                category="h2h_eos"
                payouts={h2hPayouts}
                confirmAction={confirmH2hEosAndRedirect}
                confirmHiddenFields={{ throughGw }}
                markPaidAction={markEosPaidAndRedirect}
              />
            ) : (
              <LockedConfirmNote />
            )}
          </div>
        </section>

        <section className="space-y-4">
          <WinnersPreviewTable
            title={`H2H specials · ${formatNgn(PRIZES.h2hSpecials[0].amountNgn)} each`}
            winners={specials.winners}
            empty="No H2H specials yet."
          />
          {seasonComplete ? (
            <AdminPayoutWorkflow
              trackLabel={`H2H specials · GW${throughGw}`}
              gameweek={throughGw}
              category="h2h_special"
              payouts={specialPayouts}
              confirmAction={confirmH2hSpecialsAndRedirect}
              confirmHiddenFields={{ throughGw }}
              markPaidAction={markEosPaidAndRedirect}
            />
          ) : (
            <LockedConfirmNote />
          )}
        </section>
      </div>

      <p className="mt-8 text-sm text-white/50">
        Weekly desk{" "}
        <Link href="/admin/gameweek" className="text-gold hover:underline">
          /admin/gameweek
        </Link>
        · MOTM{" "}
        <Link href="/motm" className="text-gold hover:underline">
          /motm
        </Link>
        · Manual{" "}
        <Link href="/admin/payouts" className="text-gold hover:underline">
          /admin/payouts
        </Link>
        .
      </p>
    </div>
  );
}

function LockedConfirmNote() {
  return (
    <p className="rounded-xl border border-dashed border-white/15 bg-panel/40 px-4 py-3 text-sm text-white/50">
      Confirm &amp; pay unlocks when the final gameweek of the season is
      finished.
    </p>
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
