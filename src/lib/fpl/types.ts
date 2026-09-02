export type FplBootstrapStatic = {
  events: Array<{
    id: number;
    name: string;
    deadline_time: string;
    is_current: boolean;
    finished: boolean;
  }>;
  teams: Array<{
    id: number;
    name: string;
    short_name: string;
    code: number;
  }>;
};

export type FplEntry = {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
  favourite_team: number | null;
  /** Custom FPL team badge URL, "Pending", or null */
  club_badge_src: string | null;
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
  /** Not always present on FPL standings payload — we compute from matches. */
  points_against?: number;
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
  chips?: Array<{
    name: string;
    event: number;
    time?: string;
  }>;
};

export type H2hMatchRow = {
  id: number;
  event: number;
  entry_1_entry: number | null;
  entry_1_name: string | null;
  entry_1_player_name: string | null;
  entry_1_points: number | null;
  entry_2_entry: number | null;
  entry_2_name: string | null;
  entry_2_player_name: string | null;
  entry_2_points: number | null;
  is_bye: boolean;
};

export type H2hMatchesPage = {
  has_next: boolean;
  page: number;
  results: H2hMatchRow[];
};
