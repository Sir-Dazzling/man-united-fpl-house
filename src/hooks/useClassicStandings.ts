"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClassicStandingRow } from "@/lib/fpl/types";
import { fetchJson, fplKeys } from "@/lib/fpl/query-keys";

export type ClassicStandingsPayload = {
  league: { id: number; name: string };
  results: ClassicStandingRow[];
  hidden: number;
  code: string;
  gw: { id: number; name: string; finished: boolean } | null;
};

export function useClassicStandings() {
  return useQuery({
    queryKey: fplKeys.classicStandings,
    queryFn: () =>
      fetchJson<ClassicStandingsPayload>("/api/fpl/classic-standings"),
  });
}
