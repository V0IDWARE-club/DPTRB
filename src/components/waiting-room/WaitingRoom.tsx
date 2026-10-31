import React, { useEffect, useState, useRef } from "react";
import { Header } from "../common/Header";
import { Footer } from "../common/Footer";
import { apiService } from "../../services/apiService";
import { socketService } from "../../services/socketService";
import { soundFX } from "../../utils/soundEffects";
import type { Player, GameSession } from "../../types";
import "./waiting-room.css";

interface WaitingRoomProps {
  currentPlayer: Player;
  onGameStart: () => void;
  onAbort: () => void;
  onNavigateLeaderboard: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  currentPlayer,
  onGameStart,
  onAbort,
  onNavigateLeaderboard,
}) => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [isStartingCountdown, setIsStartingCountdown] = useState(false);
  const lastTickSoundRef = useRef<number>(-1);

  // Load initial session state and registered players
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const sess = await apiService.getActiveSession();
        if (!isMounted) return;
        setSession(sess);

        if (sess.countdown_remaining_seconds !== null && sess.countdown_remaining_seconds !== undefined) {
          setCountdownRemaining(sess.countdown_remaining_seconds);
        }

        const players = await apiService.getRegisteredPlayers(sess.id);
        if (!isMounted) return;
        setPlayersList(players);
        setPlayerCount(Math.max(1, players.length));
      } catch (e) {
        console.warn("Could not load waiting room initial data:", e);
      }
    }

    loadData();

    // Setup WebSocket subscribers
    const unsubJoin = socketService.subscribe("PLAYER_JOINED", (data: any) => {
      if (data.player_count !== undefined) {
        setPlayerCount(data.player_count);
      }
      if (data.player) {
        setPlayersList((prev) => {
          if (prev.some((p) => p.id === data.player.id)) return prev;
          return [...prev, data.player];
        });
        soundFX.playClick();
      }
    });

    const unsubStart = socketService.subscribe("COUNTDOWN_STARTED", (data: any) => {
      const dur = data.duration || 15;
      setCountdownRemaining(dur);
      soundFX.playCountdownTick();
    });

    const unsubTick = socketService.subscribe("COUNTDOWN_TICK", (data: any) => {
      const sec = data.seconds_remaining;
      setCountdownRemaining(sec);

      // Sound tick on integer boundary
      const intSec = Math.floor(sec);
      if (intSec !== lastTickSoundRef.current && intSec <= 5) {
        lastTickSoundRef.current = intSec;
        soundFX.playCountdownTick(intSec <= 3);
      }
    });

    const unsubGameStart = socketService.subscribe("GAME_START", () => {
      soundFX.playGameStart();
      onGameStart();
    });

    const unsubReset = socketService.subscribe("SESSION_RESET", () => {
      loadData();
    });

    return () => {
      isMounted = false;
      unsubJoin();
      unsubStart();
      unsubTick();
      unsubGameStart();
      unsubReset();
    };
  }, [onGameStart]);

  const handleStartCountdown = async (duration = 15) => {
    try {
      setIsStartingCountdown(true);
      soundFX.playClick();
      await apiService.startCountdown(duration);
    } catch (err: any) {
      console.error("Failed to start countdown:", err);
    } finally {
      setIsStartingCountdown(false);
    }
  };

  return (
    <div className="waiting-container">
      <Header
        operatorName={currentPlayer.name}
        operatorId={currentPlayer.id}
        onNavigateLeaderboard={onNavigateLeaderboard}
        activeStatusText={`SESSION ${session?.id || currentPlayer.session_id} // 60 FPS`}
      />

      <main className="waiting-main">
        <h1 className="waiting-headline">
          wait untill all the players get in their names
        </h1>

        <div className="waiting-center-hud">
          {/* Circular Countdown Ring */}
          <div className="countdown-hud-circle">
            <div className="circle-dash-ring"></div>
            <div className="circle-solid-glow-ring"></div>

            <div className="countdown-hud-content">
              <span className="hud-label-tminus">T-MINUS</span>
              <span className="hud-countdown-number">
                {countdownRemaining !== null
                  ? countdownRemaining.toFixed(1)
                  : "15.0"}
              </span>
              <span className="hud-label-seconds">SECONDS</span>
            </div>
          </div>

          {/* Connected players roster info */}
          <div className="roster-panel">
            <div className="roster-header">
              <span className="roster-title">
                // CONNECTED OPERATORS: <strong>{playerCount}</strong>
              </span>
              <span className="roster-live-indicator">LIVE SYNC</span>
            </div>

            <div className="roster-chips">
              {playersList.map((p) => {
                const isCurrent = p.id === currentPlayer.id;
                return (
                  <div
                    key={p.id}
                    className={`operator-chip ${isCurrent ? "current" : ""}`}
                  >
                    <span className="chip-prefix">&gt;</span>
                    <span className="chip-name">{p.name}</span>
                    {isCurrent && <span className="chip-badge">YOU</span>}
                  </div>
                );
              })}
            </div>

            {/* Organizer trigger button if countdown hasn't started yet */}
            {countdownRemaining === null && (
              <div className="countdown-control-bar">
                <button
                  className="btn-trigger-countdown"
                  onClick={() => handleStartCountdown(15)}
                  disabled={isStartingCountdown}
                >
                  {isStartingCountdown ? "SYNCHRONIZING..." : "START COUNTDOWN (15s) →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer
        latency="142ms"
        velocity="1.4x"
        onAbort={onAbort}
        rightText="• VOIDWARE CS CLUB // SYSTEM READY"
      />
    </div>
  );
};
