"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeLeadsPayload } from "@/lib/gw-leads";
import { fetchJson, fplKeys } from "@/lib/fpl/query-keys";

export function useHomeLeads() {
  return useQuery({
    queryKey: fplKeys.homeLeads,
    queryFn: () => fetchJson<HomeLeadsPayload>("/api/fpl/home-leads"),
  });
}
