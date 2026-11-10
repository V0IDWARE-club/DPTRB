import React, { useState } from "react";
import { VoidEmblem } from "../common/VoidEmblem";
import { Header } from "../common/Header";
import { apiService } from "../../services/apiService";
import { soundFX } from "../../utils/soundEffects";
import type { Player } from "../../types";
import "./welcome.css";

interface WelcomeProps {
  onRegistered: (player: Player) => void;
  onViewLeaderboard: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({
  onRegistered,
  onViewLeaderboard,
}) => {
  const [codename, setCodename] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = codename.trim();

    if (!cleanName) {
      soundFX.playWrong();
      setErrorMessage("Please enter an operator codename.");
      return;
    }

    if (cleanName.length > 30) {
      soundFX.playWrong();
      setErrorMessage("Codename must be 30 characters or fewer.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    soundFX.playClick();

    try {
      // Send registration request via reusable API service
      const player = await apiService.registerPlayer(cleanName);

      // Persist in localStorage to avoid accidental duplicate registrations
      localStorage.setItem("voidware_player_id", player.id);
      localStorage.setItem("voidware_player_name", player.name);
      localStorage.setItem("voidware_session_id", player.session_id);

      soundFX.playCorrect();
      onRegistered(player);
    } catch (err: any) {
      soundFX.playWrong();
      setErrorMessage(err.message || "Failed to register operator. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="welcome-container">
      {/* Background sci-fi coordinates */}
      <div className="bg-coord coord-tl">01010110 // VOID</div>
      <div className="bg-coord coord-tr">&lt;panic_event loop-120s&gt;</div>
      <div className="bg-coord coord-bl">REFLEX_TICK::0x9B6DFF</div>
      <div className="bg-coord coord-br">11001001_NODE</div>
      <div className="bg-coord coord-bc">// CS_CLUB_2025</div>

      {/* Background subtle orbital radar circles */}
      <div className="orbital-grid">
        <div className="orbit-circle orbit-1"></div>
        <div className="orbit-circle orbit-2"></div>
        <div className="orbit-circle orbit-3"></div>
      </div>

      <Header
        showHallOfFameButton={true}
        onNavigateLeaderboard={onViewLeaderboard}
        activeStatusText="PLAYER REGISTRATION // OPEN"
      />

      <main className="welcome-main">
        <div className="welcome-center-content">
          <div className="emblem-wrapper">
            <VoidEmblem size={170} />
          </div>

          <div className="presentation-tag">
            COMPUTER SCIENCE CLUB PRESENTS
          </div>

          <h1 className="welcome-hero-title">
            READY TO BREAK<br />
            <span className="gradient-highlight">YOUR BRAIN?</span>
          </h1>

          <p className="welcome-description">
            Enter the void. Test your reflexes under alternating panic
            directives. Claim your rank on the leaderboard.
          </p>

          <div className="registration-card">
            <div className="card-top-row">
              <span className="card-label">OPERATOR CODENAME</span>
              <span className="card-required">REQUIRED</span>
            </div>

            <p className="registration-note">
              Choose a unique username. Your codename will appear on the VOIDWARE leaderboard.
            </p>

            <form onSubmit={handleSubmit} className="codename-form">
              <div className="input-box">
                <span className="prompt-arrow">&gt;</span>
                <input
                  type="text"
                  className="codename-input"
                  placeholder="ENTER YOUR CODENAME"
                  value={codename}
                  onChange={(e) => {
                    setCodename(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  maxLength={30}
                  autoFocus
                  required
                />
              </div>

              {errorMessage && (
                <div className="registration-error-alert" role="alert">
                  <span className="alert-icon">⚠</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-initialize"
                disabled={isSubmitting}
              >
                {isSubmitting ? "AUTHENTICATING..." : "INITIALIZE GAME →"}
              </button>
            </form>

            <button
              type="button"
              className="btn-how-to-play-toggle"
              onClick={() => {
                soundFX.playClick();
                setShowHowToPlay(true);
              }}
            >
              📖 HOW TO PLAY // PROTOCOL RULES
            </button>
          </div>
        </div>
      </main>

      {/* How to Play Screen / Modal */}
      {showHowToPlay && (
        <div className="how-to-play-modal-overlay" onClick={() => setShowHowToPlay(false)}>
          <div className="how-to-play-card" onClick={(e) => e.stopPropagation()}>
            <div className="how-to-play-header">
              <h3>// PROTOCOL GUIDELINES: HOW TO PLAY</h3>
              <button
                className="btn-close-modal"
                onClick={() => {
                  soundFX.playClick();
                  setShowHowToPlay(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="how-to-play-rules">
              <div className="rule-item">
                <span className="rule-num">01</span>
                <div>
                  <strong>2 MINUTES ROUND:</strong> You have 2 minutes (120 seconds) to score as many points as possible.
                </div>
              </div>

              <div className="rule-item">
                <span className="rule-num">02</span>
                <div>
                  <strong>6 NEURAL CORES (LIVES):</strong> Each mistake burns 1 core. Losing all 6 cores ends the game.
                </div>
              </div>

              <div className="rule-item">
                <span className="rule-num">03</span>
                <div>
                  <strong>DIRECTIVES:</strong> Follow alternating directives in the center HUD — <code>CLICK [COLOR]</code> or <code>DON'T CLICK [COLOR]</code>.
                </div>
              </div>

              <div className="rule-item">
                <span className="rule-num">04</span>
                <div>
                  <strong>SPEED ACCELERATION:</strong> Directives switch faster as your score climbs. Maintain streak combos for multiplier bonuses!
                </div>
              </div>
            </div>

            <footer className="how-to-play-footer">
              <span>Made all by Zabour Reihana</span>
            </footer>
          </div>
        </div>
      )}

      <footer className="welcome-bottom-spec">
        <div className="spec-item">ROUND: 2 MIN (120S)</div>
        <div className="spec-dot">•</div>
        <div className="spec-item">LIVES: 6 CORES</div>
        <div className="spec-dot">•</div>
        <div className="spec-item">MODES: CLICK / DON'T</div>
        <div className="spec-dot">•</div>
        <div className="welcome-footer-credit">Made all by Zabour Reihana</div>
      </footer>
    </div>
  );
};
