import React, { useEffect, useState } from "react";
import { Header } from "../common/Header";
import { apiService } from "../../services/apiService";
import { soundFX } from "../../utils/soundEffects";
import { formatPlayerId } from "../../utils/formatters";
import type { Player, PlayerResult } from "../../types";
import "./user-score.css";

interface UserScoreProps {
  player: Player;
  initialResult?: PlayerResult | null;
  onViewLeaderboard: () => void;
}

export const UserScore: React.FC<UserScoreProps> = ({
  player,
  initialResult,
  onViewLeaderboard,
}) => {
  const [result, setResult] = useState<PlayerResult | null>(initialResult || null);
  const [isLoading, setIsLoading] = useState(!initialResult);

  useEffect(() => {
    let isMounted = true;

    async function fetchResult() {
      try {
        const fetched = await apiService.getPlayerResult(player.id, player.session_id);
        if (isMounted) {
          setResult(fetched);
        }
      } catch (e) {
        console.warn("Could not fetch player result from backend:", e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (!result) {
      fetchResult();
    }
  }, [player, result]);

  const score = result?.final_score ?? 0;
  const bestStreak = result?.best_streak ?? 0;
  const accuracy = result?.accuracy ?? 0.0;
  const reactionTime = result?.average_reaction_time ?? 350;
  const lives = result?.remaining_lives ?? 0;
  const rank = result?.rank ?? 1;
  const total = result?.total_players ?? 1;
  const percentile = result?.percentile ?? 95.0;
  const tier = result?.tier ?? (score >= 2500 ? "TIER S" : "TIER A");
  const rankEvaluation = result?.rank_evaluation ?? "APEX REFLEX";
  const classRating = result?.class_rating ?? "CLASS_A++";

  if (isLoading && !result) {
    return (
      <div className="score-container">
        <Header operatorName={player.name} operatorId={player.id} />
        <main className="score-main">
          <div className="diagnostic-pill">AUTHENTICATING TELEMETRY...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="score-container">
      {/* Background sci-fi coordinates */}
      <div className="bg-coord coord-tl">01010110 // VOID</div>
      <div className="bg-coord coord-tr">&lt;panic_event loop-45s&gt;</div>
      <div className="bg-coord coord-bl">REFLEX_TICK::0x9B6DFF</div>
      <div className="bg-coord coord-br">11001001_NODE</div>

      <Header
        operatorName={player.name}
        operatorId={player.id}
        onNavigateLeaderboard={onViewLeaderboard}
        activeStatusText="BENCHMARK ARCHIVED"
      />

      <main className="score-main">
        {/* Top session pill */}
        <div className="diagnostic-pill">
          <span className="pill-dot"></span>
          <span>
            DIAGNOSTIC COMPLETE // SESSION{" "}
            <strong>{player.session_id.toUpperCase()}</strong>
          </span>
          <span className="pill-divider">|</span>
          <span className="mono-muted">ID: {formatPlayerId(player.id)}</span>
        </div>

        {/* Headline */}
        <div className="score-headline-section">
          <div className="saved-badge">
            <span className="check-icon">✔</span>
            <span>TELEMETRY BENCHMARK SAVED</span>
          </div>

          <h1 className="protocol-complete-title">PROTOCOL COMPLETE</h1>

          <p className="protocol-subtitle">
            Operator <strong className="op-name">{player.name}</strong>{" "}
            <span className="op-id-tag">[{formatPlayerId(player.id)}]</span> // Neural
            reflexes successfully captured &amp; authenticated.
          </p>
        </div>

        {/* Main Score Card with Bracket Corners */}
        <div className="score-card-with-brackets">
          <div className="corner-bracket corner-tl">┌</div>
          <div className="corner-bracket corner-tr">┐</div>
          <div className="corner-bracket corner-bl">└</div>
          <div className="corner-bracket corner-br">┘</div>

          <div className="score-hero-block">
            <span className="score-hero-label">FINAL PROTOCOL SCORE</span>
            <div className="score-hero-value">
              <strong>{score.toLocaleString()}</strong>{" "}
              <span className="pts-label">PTS</span>
            </div>
            <div className="score-hero-meta">
              <span className="meta-dot">•</span>
              <span>
                {percentile}% PERCENTILE // CS CLUB LEADERBOARD (RANK #{rank} OF{" "}
                {total})
              </span>
            </div>
          </div>

          {/* 2x2 Grid of Sub-Stats */}
          <div className="substats-2x2-grid">
            {/* Stat 1: Best Streak */}
            <div className="substat-box">
              <div className="substat-header">
                <span className="substat-title">BEST STREAK</span>
                <span className="substat-icon">⚡</span>
              </div>
              <div className="substat-main-num">{bestStreak}</div>
              <div className="substat-sublabel">CONSECUTIVE HITS</div>
            </div>

            {/* Stat 2: Reaction Time */}
            <div className="substat-box">
              <div className="substat-header">
                <span className="substat-title">REACTION TIME</span>
                <span className="substat-icon">⏱</span>
              </div>
              <div className="substat-main-num">
                {Math.round(reactionTime)}{" "}
                <span className="unit-ms">ms</span>
              </div>
              <div className="substat-sublabel">AVG REFLEX SPEED</div>
            </div>

            {/* Stat 3: Accuracy */}
            <div className="substat-box">
              <div className="substat-header">
                <span className="substat-title">ACCURACY</span>
                <span className="substat-icon">🎯</span>
              </div>
              <div className="substat-main-num">{accuracy.toFixed(1)}%</div>
              <div className="substat-sublabel">SYNAPTIC PRECISION</div>
            </div>

            {/* Stat 4: Lives Retained */}
            <div className="substat-box">
              <div className="substat-header">
                <span className="substat-title">LIVES RETAINED</span>
                <span className="substat-icon">♥</span>
              </div>
              <div className="substat-cores-dots">
                {[0, 1, 2, 3].map((idx) => (
                  <span
                    key={idx}
                    className={`core-circle ${idx < lives ? "intact" : "lost"}`}
                  ></span>
                ))}
              </div>
              <div className="substat-sublabel">{lives}/4 CORES INTACT</div>
            </div>
          </div>

          {/* Rank Evaluation Banner */}
          <div className="rank-eval-box">
            <div className="rank-eval-top">
              <div className="rank-eval-tier">
                <span className="tier-badge">{tier}</span>
                <span className="tier-title">
                  RANK EVALUATION: <strong>{rankEvaluation}</strong>
                </span>
              </div>
              <span className="rank-class-badge">{classRating}</span>
            </div>

            <p className="rank-eval-desc">
              Your reflexes have been encoded and dispatched to the VOIDWARE core
              archive. Superior synaptic latency response detected across
              high-tempo stimulus variations.
            </p>
          </div>

          {/* Record Committed Banner */}
          <div className="record-archive-banner">
            <div className="archive-left">
              <span className="archive-icon">🛡</span>
              <span>RECORD COMMITTED TO LOCAL TERMINAL ARCHIVE</span>
            </div>
            <div className="archive-right">
              <span>01000011 // SAVED</span>
            </div>
          </div>
        </div>

        {/* View Hall of Fame Action Button */}
        <div className="score-action-row">
          <button
            className="btn-view-hall-of-fame"
            onClick={() => {
              soundFX.playClick();
              onViewLeaderboard();
            }}
          >
            VIEW HALL OF FAME →
          </button>
        </div>
      </main>

      <footer className="score-footer">
        <div className="footer-left-info">
          <span>REFLEX_TICK: 0x9B6DFF</span>
          <span className="footer-sep">SYS_CHECKSUM_OK</span>
          <span>v2.5_PROD</span>
        </div>
        <div className="score-footer-credit">
          Made all by Zabour Reihana
        </div>
        <div className="footer-right-info">
          <span className="footer-dot">•</span>
          <span>VOIDWARE CS CLUB</span>
        </div>
      </footer>
    </div>
  );
};
