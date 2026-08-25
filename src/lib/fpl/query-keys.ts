export const fplKeys = {
  bootstrap: ["fpl", "bootstrap"] as const,
  homeLeads: ["fpl", "home-leads"] as const,
  classicStandings: ["fpl", "classic-standings"] as const,
  h2hStandings: ["fpl", "h2h-standings"] as const,
  h2hFixtures: (gw: number) => ["fpl", "h2h-fixtures", gw] as const,
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export { fetchJson };
