"use client";

import Image from "next/image";
import { useHomeLeads } from "@/hooks/useHomeLeads";
import { FraudCard } from "@/components/WinnersPreview";
import { CLASSIC_LABELS, H2H_LABELS } from "@/lib/fpl-labels";
import type { GwLead, GwStatus } from "@/lib/gw-leads";

export function HomeLiveSection() {
  const { data, isPending, isError, error, isFetching } = useHomeLeads();

  if (isPending) {
    return (
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <p className="rounded-2xl border border-united/40 bg-united/10 px-4 py-6 text-sm text-white/70">
          Couldn’t load live leads
          {error instanceof Error ? `: ${error.message}` : "."}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 md:grid-cols-3">
      <LeadCard
        eyebrow={`GW${data.gwId} Classic`}
        lead={data.classic}
        emptyHint="Scores aren’t in yet"
      />
      <LeadCard
        eyebrow={`GW${data.gwId} H2H`}
        lead={data.h2h}
        emptyHint="No finished H2H wins yet"
      />
      <div className="md:col-span-1">
        <FraudCard title="Fraud watch" fraud={data.fraud} compact />
        {isFetching ? (
          <p className="mt-2 text-[11px] text-white/35">Refreshing…</p>
        ) : null}
      </div>
    </section>
  );
}

function LeadCard({
  eyebrow,
  lead,
  emptyHint,
}: {
  eyebrow: string;
  lead: GwLead | null;
  emptyHint: string;
}) {
  const initials = teamInitials(lead?.teamName || lead?.managerName || "");

  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">{eyebrow}</p>
        {lead ? <StatusChip status={lead.gwStatus} /> : (
          <StatusChip status="pre" />
        )}
      </div>
      {lead ? (
        <div className="mt-4 flex items-start gap-3">
          {lead.badgeUrl ? (
            <Image
              src={lead.badgeUrl}
              alt=""
              width={48}
              height={48}
              className="mt-0.5 h-12 w-12 shrink-0 object-contain"
            />
          ) : (
            <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-ink/40 font-display text-lg text-gold">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-display text-3xl leading-none text-white">
              {lead.managerName}
            </p>
            <p className="mt-2 text-sm text-white/65">{lead.teamName}</p>
            <p className="mt-2 text-sm font-semibold tabular-nums text-gold">
              {lead.track === "h2h" && lead.opponentPoints != null
                ? `${lead.points}–${lead.opponentPoints} · +${lead.metricValue} margin`
                : `${lead.points} ${CLASSIC_LABELS.gwPoints.toLowerCase()}`}
            </p>
            <p className="mt-1.5 text-xs text-white/50">
              {lead.track === "h2h"
                ? h2hStateLine(lead)
                : leadStateLine(lead)}
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-3 font-display text-3xl text-white/50">TBD</p>
          <p className="mt-1 text-sm text-white/50">{emptyHint}</p>
        </>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: GwStatus }) {
  const label =
    status === "live"
      ? "Live"
      : status === "finished"
        ? "Final"
        : "Waiting on scores";
  const tone =
    status === "live"
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
      : status === "finished"
        ? "border-gold/40 bg-gold/15 text-gold"
        : "border-white/15 bg-white/5 text-white/50";
  return (
    <span
      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}
    >
      {label}
    </span>
  );
}

function leadStateLine(lead: GwLead): string {
  if (lead.tiedCount > 1) {
    return `Tied on ${CLASSIC_LABELS.gwPoints} · ${CLASSIC_LABELS.transfers} decide`;
  }
  if (lead.gapToSecond > 0) {
    return `+${lead.gapToSecond} ${CLASSIC_LABELS.gwPoints.toLowerCase()} clear`;
  }
  return `Leading on ${CLASSIC_LABELS.gwPoints.toLowerCase()}`;
}

function h2hStateLine(lead: GwLead): string {
  if (lead.tiedCount > 1) {
    return `Tied ${H2H_LABELS.winMargin.toLowerCase()} · ${CLASSIC_LABELS.transfers} decide`;
  }
  if (lead.gapToSecond > 0) {
    return `Best ${H2H_LABELS.winMargin.toLowerCase()} · +${lead.gapToSecond} clear`;
  }
  return `Best ${H2H_LABELS.winMargin.toLowerCase()} among winners this GW`;
}

function teamInitials(name: string): string {
  const parts = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-panel/50 p-5">
      <div className="h-3 w-24 rounded bg-white/10" />
      <div className="mt-6 h-8 w-40 rounded bg-white/10" />
      <div className="mt-3 h-4 w-28 rounded bg-white/10" />
      <div className="mt-3 h-4 w-16 rounded bg-white/10" />
    </div>
  );
}
