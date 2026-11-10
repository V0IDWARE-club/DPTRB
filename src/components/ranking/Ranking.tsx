import { useEffect, useState } from "react";
import { Header } from "../common/Header";
import { apiService } from "../../services/apiService";
import { socketService } from "../../services/socketService";
import { soundFX } from "../../utils/soundEffects";
import { formatPlayerId } from "../../utils/formatters";
import type { Player, LeaderboardResponse } from "../../types";
import "./ranking.css";

interface RankingProps {
  currentPlayer?: Player | null;
  onNavigateThankYou: () => void;
  onBackToGame?: () => void;
}

export const Ranking: React.FC<RankingProps> = ({
  currentPlayer,
  onNavigateThankYou,
  onBackToGame,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const data = await apiService.getLeaderboard(currentPlayer?.session_id);
      setLeaderboard(data);
    } catch (e) {
      console.warn("Could not fetch leaderboard data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to live leaderboard updates via WebSocket
    const unsubLeaderboard = socketService.subscribe("LEADERBOARD_UPDATE", (data: any) => {
      if (data.leaderboard && data.top3) {
        setLeaderboard((prev) => ({
          session_id: data.session_id || prev?.session_id || "",
          total_participants: data.leaderboard.length,
          completed_count: data.leaderboard.length,
          top3: data.top3,
          remaining: data.leaderboard.slice(3),
          all_entries: data.leaderboard,
        }));
        soundFX.playClick();
      }
    });

    const unsubResult = socketService.subscribe("RESULT_SUBMITTED", () => {
      fetchLeaderboard();
    });

    return () => {
      unsubLeaderboard();
      unsubResult();
    };
  }, [currentPlayer?.session_id]);

  const top3 = leaderboard?.top3 || [];
  const rank1 = top3[0];
  const rank2 = top3[1];
  const rank3 = top3[2];
  const remaining = leaderboard?.remaining || [];

  return (
    <div className="ranking-container">
      {/* Background sci-fi coordinates */}
      <div className="bg-coord coord-tl">01010110 // VOID</div>
      <div className="bg-coord coord-tr">&lt;panic_event loop-120s&gt;</div>
      <div className="bg-coord coord-bl">REFLEX_TICK::0x9B6DFF</div>
      <div className="bg-coord coord-br">11001001_NODE</div>

      <Header
        operatorName={currentPlayer?.name}
        operatorId={currentPlayer?.id}
        showHallOfFameButton={false}
        activeStatusText="GLOBAL RANKINGS SYNCED"
      />

      <main className="ranking-main">
        {/* Tournament Tag & Cycle */}
        <div className="ranking-header-banner">
          <div className="tournament-pill">
            <span className="pill-dot"></span>
            <span>COMPUTER SCIENCE CLUB // ANNUAL TOURNAMENT</span>
          </div>
          <div className="cycle-pill">
            <span className="cycle-icon">⚑</span>
            <span>CYCLE 2025.2</span>
          </div>
        </div>

        {/* Title */}
        <div className="ranking-title-block">
          <h1 className="hall-of-fame-title">VOIDWARE // HALL OF FAME</h1>
          <div className="title-glow-line"></div>
          <p className="ranking-subtitle">THE FASTEST MINDS IN THE VOID</p>
        </div>

        {/* Podium Area: Top 3 Players */}
        <div className="podium-card-container">
          {top3.length === 0 && !isLoading ? (
            <div className="leaderboard-empty-state">
              <span className="empty-icon">⚡</span>
              <h3>NO TELEMETRY RECORDED YET</h3>
              <p>Be the first operator to complete the reaction diagnostic!</p>
            </div>
          ) : (
            <div className="podium-grid">
              {/* 2nd Place (Left) */}
              <div className={`podium-card rank-2-card ${rank2?.player_id === currentPlayer?.id ? "is-you" : ""}`}>
                {rank2 ? (
                  <>
                    <div className="podium-badge badge-silver">02</div>
                    {rank2.player_id === currentPlayer?.id && (
                      <div className="you-pill">★ YOU</div>
                    )}
                    <div className="podium-role-label">CONTENDER</div>
                    <div className="podium-player-name">{rank2.player_name}</div>
                    <div className="podium-player-id">ID: {formatPlayerId(rank2.player_id)}</div>
                    <div className="podium-score-val">
                      {rank2.final_score.toLocaleString()} <span className="pts-small">PTS</span>
                    </div>
                    <div className="podium-streak-label">Streak x{rank2.best_streak}</div>
                    <div className="podium-pedestal pedestal-silver">
                      <div className="pedestal-accent-line"></div>
                    </div>
                  </>
                ) : (
                  <div className="podium-placeholder">
                    <div className="podium-badge badge-silver">02</div>
                    <div className="empty-slot-text">AWAITING CONTENDER</div>
                    <div className="podium-pedestal pedestal-silver"></div>
                  </div>
                )}
              </div>

              {/* 1st Place (Center - Taller, Gold) */}
              <div className={`podium-card rank-1-card ${rank1?.player_id === currentPlayer?.id ? "is-you" : ""}`}>
                {rank1 ? (
                  <>
                    <div className="gold-medal-wrapper">
                      <div className="medal-ribbon-icon">✪</div>
                      <div className="gold-apex-badge">01 APEX</div>
                    </div>
                    {rank1.player_id === currentPlayer?.id && (
                      <div className="you-pill gold-you">★ YOU</div>
                    )}
                    <div className="podium-role-label gold-role">CHAMPION</div>
                    <div className="podium-player-name gold-name">{rank1.player_name}</div>
                    <div className="podium-player-id gold-id">ID: {formatPlayerId(rank1.player_id)}</div>
                    <div className="podium-score-val gold-score">
                      {rank1.final_score.toLocaleString()} <span className="pts-small">PTS</span>
                    </div>
                    <div className="podium-streak-label gold-streak">Streak x{rank1.best_streak}</div>
                    <div className="podium-pedestal pedestal-gold">
                      <div className="pedestal-accent-line gold-line"></div>
                    </div>
                  </>
                ) : (
                  <div className="podium-placeholder">
                    <div className="gold-apex-badge">01 APEX</div>
                    <div className="empty-slot-text">AWAITING CHAMPION</div>
                    <div className="podium-pedestal pedestal-gold"></div>
                  </div>
                )}
              </div>

              {/* 3rd Place (Right - Bronze) */}
              <div className={`podium-card rank-3-card ${rank3?.player_id === currentPlayer?.id ? "is-you" : ""}`}>
                {rank3 ? (
                  <>
                    <div className="podium-badge badge-bronze">03</div>
                    {rank3.player_id === currentPlayer?.id && (
                      <div className="you-pill">★ YOU</div>
                    )}
                    <div className="podium-role-label bronze-role">OPERATIVE</div>
                    <div className="podium-player-name">{rank3.player_name}</div>
                    <div className="podium-player-id">ID: {formatPlayerId(rank3.player_id)}</div>
                    <div className="podium-score-val">
                      {rank3.final_score.toLocaleString()} <span className="pts-small">PTS</span>
                    </div>
                    <div className="podium-streak-label">Streak x{rank3.best_streak}</div>
                    <div className="podium-pedestal pedestal-bronze">
                      <div className="pedestal-accent-line bronze-line"></div>
                    </div>
                  </>
                ) : (
                  <div className="podium-placeholder">
                    <div className="podium-badge badge-bronze">03</div>
                    <div className="empty-slot-text">AWAITING OPERATIVE</div>
                    <div className="podium-pedestal pedestal-bronze"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lower List: Ranked Concurrent Nodes */}
        {remaining.length > 0 && (
          <div className="ranked-nodes-card">
            <div className="nodes-card-header">
              <span className="nodes-header-title">
                <span className="nodes-icon">≡</span> RANKED CONCURRENT NODES
              </span>
              <span className="nodes-header-range">
                RANKS #{String(remaining[0].rank).padStart(2, "0")} - #
                {String(remaining[remaining.length - 1].rank).padStart(2, "0")}
              </span>
            </div>

            <div className="nodes-list">
              {remaining.map((entry) => {
                const isCurrent = entry.player_id === currentPlayer?.id;
                return (
                  <div
                    key={entry.player_id}
                    className={`node-row ${isCurrent ? "node-current" : ""}`}
                  >
                    <div className="node-rank-badge">
                      #{String(entry.rank).padStart(2, "0")}
                    </div>
                    <div className="node-info">
                      <div className="node-name-row">
                        <span className="node-name">{entry.player_name}</span>
                        <span className="node-player-id">[{formatPlayerId(entry.player_id)}]</span>
                        {isCurrent && <span className="node-you-tag">YOU</span>}
                      </div>
                      <span className="node-streak">Streak x{entry.best_streak}</span>
                    </div>
                    <div className="node-score-val">
                      <strong>{entry.final_score.toLocaleString()}</strong> PTS
                      <span className="node-dot">•</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="nodes-card-footer">
              <div className="live-refresh-badge">
                <span className="dot-green">••</span>
                <span>LOCAL TERMINAL LEADERBOARD // REFRESHES REAL-TIME</span>
              </div>
              <div className="engine-meta">ENGINE 2.5</div>
            </div>
          </div>
        )}

        {/* Action Button Navigation */}
        <div className="ranking-action-row">
          {onBackToGame && (
            <button
              className="btn-back-game"
              onClick={() => {
                soundFX.playClick();
                onBackToGame();
              }}
            >
              ← RETURN TO PROTOCOL
            </button>
          )}

          <button
            className="btn-thankyou"
            onClick={() => {
              soundFX.playClick();
              onNavigateThankYou();
            }}
          >
            THANK YOU SCREEN →
          </button>
        </div>
      </main>

      <footer className="ranking-bottom-footer">
        <div className="footer-left-info">
          <span className="footer-dot">•</span>
          <span>VOIDWARE CS CLUB</span>
        </div>
        <div className="ranking-footer-credit">
          Made all by Zabour Reihana
        </div>
      </footer>
    </div>
  );
};
