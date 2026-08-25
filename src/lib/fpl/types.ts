export type FplBootstrapStatic = {
  events: Array<{
    id: number;
    name: string;
    is_current: boolean;
    finished: boolean;
  }>;
};

export type ClassicStandingRow = {
  id: number;
  entry: number;
  entry_name: string;
  player_name: string;
  rank: number;
  last_rank: number;
  rank_sort: number;
  total: number;
  event_total: number;
};

export type ClassicStandingsPage = {
  standings: {
    has_next: boolean;
    page: number;
    results: ClassicStandingRow[];
  };
  league: {
    id: number;
    name: string;
  };
};

export type H2hStandingRow = {
  id: number;
  entry: number;
  entry_name: string;
  player_name: string;
  rank: number;
  last_rank: number;
  matches_played: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
  points_for: number;
  points_against: number;
  total: number;
};

export type H2hStandingsPage = {
  standings: {
    has_next: boolean;
    page: number;
    results: H2hStandingRow[];
  };
  league: {
    id: number;
    name: string;
  };
};

export type EntryHistory = {
  current: Array<{
    event: number;
    points: number;
    total_points: number;
    rank: number;
    overall_rank: number;
    event_transfers: number;
    event_transfers_cost: number;
  }>;
};
