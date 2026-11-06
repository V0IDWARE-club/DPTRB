import { useEffect, useRef, useState, useCallback } from "react";
import { Header } from "../common/Header";
import { Footer } from "../common/Footer";
import {
  GameEngine,
  initializeBalls,
  updateBallPhysics,
} from "../../logic/gameEngine";
import type { GameEngineState, BallPhysics } from "../../logic/gameEngine";
import { apiService } from "../../services/apiService";
import { soundFX } from "../../utils/soundEffects";
import type { Player, PlayerResult, ColorDef } from "../../types";
import "./game.css";

interface GameProps {
  player: Player;
  onFinishGame: (result: PlayerResult) => void;
  onAbort: () => void;
  onNavigateLeaderboard: () => void;
}

export const Game: React.FC<GameProps> = ({
  player,
  onFinishGame,
  onAbort,
  onNavigateLeaderboard,
}) => {
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameEngineState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Arena & Balls refs for 60fps canvas/DOM render
  const arenaRef = useRef<HTMLDivElement>(null);
  const ballsRef = useRef<BallPhysics[]>([]);
  const [balls, setBalls] = useState<BallPhysics[]>([]);
  const ballElementsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const animationFrameRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);

  // Handle Game Over: record player's final result in backend
  const handleGameOver = useCallback(
    async (finalState: GameEngineState) => {
      soundFX.playGameOver();
      setIsSubmitting(true);

      const accuracy = engineRef.current ? engineRef.current.getAccuracy() : 100.0;
      const avgReactionTime = engineRef.current
        ? engineRef.current.getAverageReactionTime()
        : 350.0;

      try {
        const result = await apiService.submitResult({
          player_id: player.id,
          session_id: player.session_id,
          final_score: finalState.score,
          best_streak: finalState.bestStreak,
          accuracy,
          average_reaction_time: avgReactionTime,
          remaining_lives: finalState.lives,
        });

        // Save result locally to avoid re-play creation on refresh
        localStorage.setItem(`voidware_result_${player.id}`, JSON.stringify(result));
        onFinishGame(result);
      } catch (err: unknown) {
        console.error("Error submitting game result:", err);
        // Fallback local result display if network fails
        const fallbackResult: PlayerResult = {
          id: `res-${Date.now()}`,
          player_id: player.id,
          session_id: player.session_id,
          player_name: player.name,
          final_score: finalState.score,
          best_streak: finalState.bestStreak,
          accuracy,
          average_reaction_time: avgReactionTime,
          remaining_lives: finalState.lives,
          completed_at: new Date().toISOString(),
          tier: finalState.score >= 2500 ? "TIER S" : "TIER A",
          rank_evaluation: "APEX REFLEX",
          class_rating: "CLASS_A++",
          rank: 1,
          total_players: 1,
          percentile: 99.0,
        };
        onFinishGame(fallbackResult);
      } finally {
        setIsSubmitting(false);
      }
    },
    [player, onFinishGame]
  );

  // Initialize engine and ball physics
  useEffect(() => {
    const engine = new GameEngine(
      (updatedState) => setGameState({ ...updatedState }),
      handleGameOver
    );
    engineRef.current = engine;
    engine.start();

    // Initialize arena balls
    const arenaSize = arenaRef.current?.clientWidth || 440;
    ballsRef.current = initializeBalls(arenaSize);
    setBalls(ballsRef.current);

    // Physics animation loop
    const animate = (timestamp: number) => {
      if (!previousTimeRef.current) previousTimeRef.current = timestamp;
      const dt = Math.min((timestamp - previousTimeRef.current) / 1000, 0.035);
      previousTimeRef.current = timestamp;

      const currentArenaSize = arenaRef.current?.clientWidth || 440;
      const speedMult = engineRef.current?.getState().speedMultiplier || 1.0;

      updateBallPhysics(ballsRef.current, currentArenaSize, dt, speedMult);

      // Update ball button DOM positions
      ballsRef.current.forEach((ball, idx) => {
        const el = ballElementsRef.current[idx];
        if (el) {
          el.style.transform = `translate(${ball.x - ball.radius}px, ${ball.y - ball.radius}px)`;
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      engine.destroy();
    };
  }, [handleGameOver]);

  const handleBallClick = (color: ColorDef) => {
    if (!engineRef.current) return;
    const isCorrect = engineRef.current.handleColorClick(color);
    if (isCorrect) {
      soundFX.playCorrect();
    } else {
      soundFX.playWrong();
    }
  };

  const directive = gameState?.currentDirective;
  const score = gameState?.score ?? 0;
  const timeLeft = gameState?.timeLeft ?? 45.0;
  const lives = gameState?.lives ?? 4;
  const streak = gameState?.streak ?? 0;
  const speedMult = gameState?.speedMultiplier ?? 1.0;
  const lastDelta = gameState?.lastHitDelta ?? 0;
  const lastStatus = gameState?.lastHitStatus;

  return (
    <div className="gameplay-container">
      <Header
        operatorName={player.name}
        operatorId={player.id}
        onNavigateLeaderboard={onNavigateLeaderboard}
        activeStatusText="PROTOCOL ACTIVE // 60 FPS"
      />

      <main className="gameplay-main">
        {/* Top 4 Stats HUD Row */}
        <div className="game-stats-grid">
          {/* Card 1: Score */}
          <div className="game-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">SCORE</span>
              <span className="stat-delta">
                {lastDelta > 0 ? `+${lastDelta} last hit` : "+0 last hit"}
              </span>
            </div>
            <div className="stat-card-value">
              <strong>{score.toLocaleString()}</strong>{" "}
              <span className="stat-unit">PTS</span>
            </div>
          </div>

          {/* Card 2: Time Remaining */}
          <div className="game-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">TIME REMAINING</span>
              <span className="stat-meta">45.0s MAX</span>
            </div>
            <div className="stat-card-value">
              <strong>{timeLeft.toFixed(1)}</strong>{" "}
              <span className="stat-unit">s</span>
            </div>
            <div className="stat-bar-track">
              <div
                className="stat-bar-fill timer-fill"
                style={{ width: `${(timeLeft / 45.0) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Card 3: Neural Cores (Lives) */}
          <div className="game-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">NEURAL CORES</span>
              <span className="stat-meta">{lives}/4 ACTIVE</span>
            </div>
            <div className="cores-badges-row">
              {[0, 1, 2, 3].map((idx) => {
                const isActive = idx < lives;
                return (
                  <div
                    key={idx}
                    className={`neural-core-box ${isActive ? "active" : "offline"}`}
                  >
                    <span className="core-dot"></span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Chain Multiplier (Streak) */}
          <div className="game-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">CHAIN MULTIPLIER</span>
              <span className="combo-badge">COMBO</span>
            </div>
            <div className="stat-card-value streak-value">
              <strong>STREAK x{streak}</strong>
            </div>
            <div className="stat-bar-track">
              <div
                className="stat-bar-fill streak-fill"
                style={{ width: `${Math.min(100, (streak / 15) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Current Directive Card */}
        {directive && (
          <div className="current-directive-box">
            <div className="directive-top-info">
              <span className="directive-label">// CURRENT DIRECTIVE</span>
              <span className="directive-speed">SPD: {speedMult}x</span>
            </div>

            <div className="directive-hero-text">
              <span className="directive-verb">
                {directive.type === "avoid" ? "DON'T CLICK" : "CLICK"}
              </span>
              <span
                className="directive-target-pill"
                style={{
                  color: directive.color.hex,
                  borderColor: directive.color.hex,
                  boxShadow: `0 0 16px ${directive.color.hex}44`,
                }}
              >
                {directive.color.name}!
              </span>
            </div>

            <div className="directive-feedback-row">
              {lastStatus === "correct" ? (
                <span className="feedback-correct">
                  • CORRECT INPUT // STREAK +1 [ +{lastDelta} PTS ]
                </span>
              ) : lastStatus === "wrong" ? (
                <span className="feedback-wrong">
                  • WRONG BUTTON // CORE OFFLINE -1
                </span>
              ) : (
                <span className="feedback-ready">
                  • AWAITING SYNAPTIC INPUT // FOLLOW DIRECTIVE
                </span>
              )}
            </div>
          </div>
        )}

        {/* Circular Radar Arena */}
        <div className="arena-wrapper">
          <div className="radar-compass-label deg-0">0°</div>
          <div className="radar-compass-label deg-90">90°</div>
          <div className="radar-compass-label deg-180">180°</div>
          <div className="radar-compass-label deg-270">270°</div>

          <div className="arena-circle" ref={arenaRef}>
            {/* Background radar concentric circles */}
            <div className="radar-ring ring-outer"></div>
            <div className="radar-ring ring-mid"></div>
            <div className="radar-ring ring-center"></div>

            {/* Radar crosshairs */}
            <div className="radar-axis axis-h"></div>
            <div className="radar-axis axis-v"></div>

            {/* Radar center chevron */}
            <div className="radar-center-chevron">∧</div>

            {/* Microcode telemetry overlay */}
            <div className="radar-code-overlay">
              while(active) &#123; reflex(); &#125;
            </div>

            {/* 6 Bouncing Color Balls */}
            {balls.map((ball, idx) => (
              <button
                key={ball.color.name}
                ref={(el) => {
                  ballElementsRef.current[idx] = el;
                }}
                className="arena-ball"
                style={{
                  backgroundColor: ball.color.hex,
                  boxShadow: `0 0 18px ${ball.color.hex}88, inset 0 0 12px rgba(255, 255, 255, 0.45)`,
                  width: `${ball.radius * 2}px`,
                  height: `${ball.radius * 2}px`,
                }}
                onClick={() => handleBallClick(ball.color)}
                disabled={gameState?.status !== "playing" || isSubmitting}
                aria-label={`Select ${ball.color.name}`}
              >
                <span className="ball-name">{ball.color.name}</span>
                <span className="ball-code">{ball.color.code}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <Footer
        latency="142ms"
        velocity={`${speedMult}x`}
        onAbort={onAbort}
        rightText="• VOIDWARE CS CLUB // SYSTEM READY"
      />
    </div>
  );
};
