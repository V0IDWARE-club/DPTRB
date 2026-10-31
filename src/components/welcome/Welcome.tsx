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
      <div className="bg-coord coord-tr">&lt;panic_event loop-30s&gt;</div>
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
          </div>
        </div>
      </main>

      <footer className="welcome-bottom-spec">
        <div className="spec-item">ROUND: 30 SEC</div>
        <div className="spec-dot">•</div>
        <div className="spec-item">LIVES: 3 CORES</div>
        <div className="spec-dot">•</div>
        <div className="spec-item">MODES: CLICK / DON'T</div>
      </footer>
    </div>
  );
};
