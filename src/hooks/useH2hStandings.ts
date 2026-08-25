"use client";

import { useQuery } from "@tanstack/react-query";
import type { H2hStandingRow } from "@/lib/fpl/types";
import { fetchJson, fplKeys } from "@/lib/fpl/query-keys";

export type H2hStandingsPayload = {
  league: { id: number; name: string };
  results: H2hStandingRow[];
  hidden: number;
  code: string;
  gw: { id: number; name: string; finished: boolean } | null;
  topPf: H2hStandingRow | null;
  topPa: H2hStandingRow | null;
};

export function useH2hStandings() {
  return useQuery({
    queryKey: fplKeys.h2hStandings,
    queryFn: () => fetchJson<H2hStandingsPayload>("/api/fpl/h2h-standings"),
  });
}
