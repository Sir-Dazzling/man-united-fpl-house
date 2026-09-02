import {
  getAllClassicStandings,
  getCurrentGameweek,
  getEntryBadgeUrl,
  getH2hMatchesForEvent,
} from "@/lib/fpl/client";
import { CLASSIC_LABELS, H2H_LABELS } from "@/lib/fpl-labels";
import { LEAGUE } from "@/lib/league-config";
import {
  filterOutSuspended,
  getSuspendedEntryIds,
} from "@/lib/suspensions";

export type GwStatus = "live" | "finished" | "pre";

/** Lightweight lead for home / teasers — no transfer lookups. */
export type GwLead = {
  entryId: number;
  managerName: string;
  teamName: string;
  /** Classic: GW pts. H2H: winner's FPL score in the match. */
  points: number;
  /** H2H only — opponent score for scoreline display */
  opponentPoints: number | null;
  /** Ranking key (Classic pts, H2H win margin) */
  metricLabel: string;
  metricValue: number;
  tiedCount: number;
  gapToSecond: number;
  gwStatus: GwStatus;
  badgeUrl: string | null;
  track: "classic" | "h2h";
};

export type GwFraudPeek = {
  entryId: number;
  managerName: string;
  teamName: string;
  roast: string;
};

export type HomeLeadsPayload = {
  gwId: number;
  gwName: string;
  gwFinished: boolean;
  classic: GwLead | null;
  h2h: GwLead | null;
  fraud: GwFraudPeek[];
};

function resolveGwStatus(finished: boolean, hasScores: boolean): GwStatus {
  if (!hasScores) return "pre";
  if (finished) return "finished";
  return "live";
}

type LeadBase = Omit<
  GwLead,
  "tiedCount" | "gapToSecond" | "gwStatus" | "badgeUrl"
>;

function withLeadMeta(
  sortedDesc: LeadBase[],
  gwStatus: GwStatus,
): Omit<GwLead, "badgeUrl"> | null {
  if (sortedDesc.length === 0) return null;
  const top = sortedDesc[0];
  const tiedCount = sortedDesc.filter(
    (r) => r.metricValue === top.metricValue,
  ).length;
  const second = sortedDesc.find((r) => r.metricValue < top.metricValue);
  const gapToSecond = second ? top.metricValue - second.metricValue : 0;
  return {
    ...top,
    tiedCount,
    gapToSecond,
    gwStatus,
  };
}

export async function peekClassicGwLead(
  _gw: number,
  gwFinished: boolean,
): Promise<Omit<GwLead, "badgeUrl"> | null> {
  const { results: raw } = await getAllClassicStandings(LEAGUE.classic.leagueId);
  const suspended = await getSuspendedEntryIds("classic");
  const results = filterOutSuspended(raw, suspended);
  const rows: LeadBase[] = results.map((r) => ({
    entryId: r.entry,
    managerName: r.player_name,
    teamName: r.entry_name,
    points: r.event_total,
    opponentPoints: null,
    metricLabel: CLASSIC_LABELS.gwPoints,
    metricValue: r.event_total,
    track: "classic" as const,
  }));
  const hasScores = rows.some((r) => r.points > 0);
  const gwStatus = resolveGwStatus(gwFinished, hasScores);
  if (!hasScores) return null;

  const sorted = [...rows].sort((a, b) => b.metricValue - a.metricValue);
  return withLeadMeta(sorted, gwStatus);
}

export async function peekH2hGwLead(
  gw: number,
  gwFinished: boolean,
): Promise<Omit<GwLead, "badgeUrl"> | null> {
  const suspended = await getSuspendedEntryIds("h2h");
  const matches = await getH2hMatchesForEvent(LEAGUE.h2h.leagueId, gw);
  const winners: LeadBase[] = [];

  for (const m of matches) {
    if (m.is_bye || !m.entry_1_entry || !m.entry_2_entry) continue;
    const p1 = m.entry_1_points ?? 0;
    const p2 = m.entry_2_points ?? 0;
    if (p1 === p2) continue;
    if (p1 > p2) {
      if (!suspended.has(m.entry_1_entry)) {
        winners.push({
          entryId: m.entry_1_entry,
          managerName: m.entry_1_player_name ?? "Unknown",
          teamName: m.entry_1_name ?? "",
          points: p1,
          opponentPoints: p2,
          metricLabel: H2H_LABELS.winMargin,
          metricValue: p1 - p2,
          track: "h2h",
        });
      }
    } else if (!suspended.has(m.entry_2_entry)) {
      winners.push({
        entryId: m.entry_2_entry,
        managerName: m.entry_2_player_name ?? "Unknown",
        teamName: m.entry_2_name ?? "",
        points: p2,
        opponentPoints: p1,
        metricLabel: H2H_LABELS.winMargin,
        metricValue: p2 - p1,
        track: "h2h",
      });
    }
  }

  const hasScores = winners.length > 0;
  const gwStatus = resolveGwStatus(gwFinished, hasScores);
  if (!hasScores) return null;

  const sorted = [...winners].sort((a, b) => b.metricValue - a.metricValue);
  return withLeadMeta(sorted, gwStatus);
}

/** Fraud from already-fetched classic rows + h2h matches (avoids double standings fetch). */
export async function peekGwFraud(
  gw: number,
  classicRows?: Array<{
    entryId: number;
    managerName: string;
    teamName: string;
    points: number;
  }>,
): Promise<GwFraudPeek[]> {
  const out: GwFraudPeek[] = [];

  let classic = classicRows;
  if (!classic) {
    const { results: raw } = await getAllClassicStandings(
      LEAGUE.classic.leagueId,
    );
    const classicSuspended = await getSuspendedEntryIds("classic");
    classic = filterOutSuspended(raw, classicSuspended).map((r) => ({
      entryId: r.entry,
      managerName: r.player_name,
      teamName: r.entry_name,
      points: r.event_total,
    }));
  }

  if (classic.length > 0 && classic.some((r) => r.points > 0)) {
    const brick = [...classic].sort((a, b) => a.points - b.points)[0];
    if (brick) {
      out.push({
        entryId: brick.entryId,
        managerName: brick.managerName,
        teamName: brick.teamName,
        roast: "Brick of the week — quietest Classic haul so far.",
      });
    }
  }

  const h2hSuspended = await getSuspendedEntryIds("h2h");
  const matches = await getH2hMatchesForEvent(LEAGUE.h2h.leagueId, gw);
  const losers: Array<{
    entryId: number;
    managerName: string;
    teamName: string;
    metricValue: number;
  }> = [];
  for (const m of matches) {
    if (m.is_bye || !m.entry_1_entry || !m.entry_2_entry) continue;
    const p1 = m.entry_1_points ?? 0;
    const p2 = m.entry_2_points ?? 0;
    if (p1 === p2) continue;
    if (p1 > p2) {
      if (!h2hSuspended.has(m.entry_2_entry)) {
        losers.push({
          entryId: m.entry_2_entry,
          managerName: m.entry_2_player_name ?? "Unknown",
          teamName: m.entry_2_name ?? "",
          metricValue: p2 - p1,
        });
      }
    } else if (!h2hSuspended.has(m.entry_1_entry)) {
      losers.push({
        entryId: m.entry_1_entry,
        managerName: m.entry_1_player_name ?? "Unknown",
        teamName: m.entry_1_name ?? "",
        metricValue: p1 - p2,
      });
    }
  }
  const cooked = [...losers].sort((a, b) => a.metricValue - b.metricValue)[0];
  if (cooked) {
    out.push({
      entryId: cooked.entryId,
      managerName: cooked.managerName,
      teamName: cooked.teamName,
      roast: "Got cooked in H2H — worst loss margin this GW.",
    });
  }

  return out;
}

async function withBadge(
  lead: Omit<GwLead, "badgeUrl"> | null,
): Promise<GwLead | null> {
  if (!lead) return null;
  const badgeUrl = await getEntryBadgeUrl(lead.entryId);
  return { ...lead, badgeUrl };
}

export async function getHomeLeadsPayload(): Promise<HomeLeadsPayload> {
  const gw = await getCurrentGameweek();
  const gwId = gw?.id ?? 1;
  const gwFinished = gw?.finished ?? false;

  const [classicRaw, h2hRaw, fraud] = await Promise.all([
    peekClassicGwLead(gwId, gwFinished),
    peekH2hGwLead(gwId, gwFinished),
    peekGwFraud(gwId),
  ]);

  const [classic, h2h] = await Promise.all([
    withBadge(classicRaw),
    withBadge(h2hRaw),
  ]);

  return {
    gwId,
    gwName: gw?.name ?? `Gameweek ${gwId}`,
    gwFinished,
    classic,
    h2h,
    fraud,
  };
}
