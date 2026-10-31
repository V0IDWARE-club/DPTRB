export interface GameSession {
  id: string;
  status: "registration" | "waiting" | "playing" | "completed";
  created_at: string;
  countdown_started_at?: string | null;
  countdown_duration: number;
  countdown_remaining_seconds?: number | null;
  game_started_at?: string | null;
  game_ended_at?: string | null;
  player_count: number;
  completed_count: number;
}

export interface Player {
  id: string;
  session_id: string;
  name: string;
  joined_at: string;
}

export interface PlayerResult {
  id: string;
  player_id: string;
  session_id: string;
  player_name: string;
  final_score: number;
  best_streak: number;
  accuracy: number;
  average_reaction_time: number;
  remaining_lives: number;
  completed_at: string;
  tier: string;
  rank_evaluation: string;
  class_rating: string;
  rank: number;
  total_players: number;
  percentile: number;
}

export interface LeaderboardEntry {
  rank: number;
  player_id: string;
  player_name: string;
  final_score: number;
  best_streak: number;
  accuracy: number;
  average_reaction_time: number;
  remaining_lives: number;
  tier: string;
  rank_evaluation: string;
  class_rating: string;
  completed_at: string;
}

export interface LeaderboardResponse {
  session_id: string;
  total_participants: number;
  completed_count: number;
  top3: LeaderboardEntry[];
  remaining: LeaderboardEntry[];
  all_entries: LeaderboardEntry[];
}

export interface Top3Response {
  first?: LeaderboardEntry | null;
  second?: LeaderboardEntry | null;
  third?: LeaderboardEntry | null;
}

export interface ColorDef {
  name: "BLUE" | "RED" | "GREEN" | "YELLOW" | "PINK" | "PURPLE";
  hex: string;
  code: string;
  number: string;
}

export interface Directive {
  color: ColorDef;
  type: "click" | "avoid";
  directiveStartTime: number;
}

export type ScreenType =
  | "welcome"
  | "waiting"
  | "game"
  | "score"
  | "ranking"
  | "thankyou";
