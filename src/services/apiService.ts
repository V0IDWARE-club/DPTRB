import type {
  GameSession,
  Player,
  PlayerResult,
  LeaderboardResponse,
  Top3Response,
} from "../types";

const API_BASE = "/api";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        errorMessage = errData.detail;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const apiService = {
  // Session methods
  async getActiveSession(): Promise<GameSession> {
    return request<GameSession>("/session/active");
  },

  async getSessionStatus(): Promise<GameSession> {
    return request<GameSession>("/session/status");
  },

  async startCountdown(durationSeconds = 15): Promise<GameSession> {
    return request<GameSession>("/session/start-countdown", {
      method: "POST",
      body: JSON.stringify({ duration_seconds: durationSeconds }),
    });
  },

  async resetSession(): Promise<GameSession> {
    return request<GameSession>("/session/reset", {
      method: "POST",
    });
  },

  // Player registration
  async registerPlayer(name: string, sessionId?: string): Promise<Player> {
    return request<Player>("/players/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        session_id: sessionId,
      }),
    });
  },

  async getRegisteredPlayers(sessionId?: string): Promise<Player[]> {
    const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    return request<Player[]>(`/players${query}`);
  },

  async getPlayer(playerId: string): Promise<Player> {
    return request<Player>(`/players/${encodeURIComponent(playerId)}`);
  },

  // Result submission
  async submitResult(resultData: {
    player_id: string;
    session_id?: string;
    final_score: number;
    best_streak: number;
    accuracy: number;
    average_reaction_time: number;
    remaining_lives: number;
  }): Promise<PlayerResult> {
    return request<PlayerResult>("/results", {
      method: "POST",
      body: JSON.stringify(resultData),
    });
  },

  async getPlayerResult(playerId: string, sessionId?: string): Promise<PlayerResult> {
    const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    return request<PlayerResult>(`/results/${encodeURIComponent(playerId)}${query}`);
  },

  // Leaderboard
  async getLeaderboard(sessionId?: string): Promise<LeaderboardResponse> {
    const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    return request<LeaderboardResponse>(`/leaderboard${query}`);
  },

  async getTop3(sessionId?: string): Promise<Top3Response> {
    const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    return request<Top3Response>(`/leaderboard/top3${query}`);
  },
};
