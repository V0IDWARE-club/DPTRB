import React from "react";
import { Header } from "../common/Header";
import { VoidEmblem } from "../common/VoidEmblem";
import { soundFX } from "../../utils/soundEffects";
import type { Player } from "../../types";
import "./thank-you.css";

interface ThankYouProps {
  currentPlayer?: Player | null;
  onNavigateLeaderboard: () => void;
  onRestart: () => void;
}

export const ThankYou: React.FC<ThankYouProps> = ({
  currentPlayer,
  onNavigateLeaderboard,
  onRestart,
}) => {
  return (
    <div className="thankyou-container">
      {/* Background sci-fi coordinates */}
      <div className="bg-coord coord-tl">01010110 // VOID</div>
      <div className="bg-coord coord-tr">&lt;panic_event loop-45s&gt;</div>
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
        operatorName={currentPlayer?.name}
        operatorId={currentPlayer?.id}
        onNavigateLeaderboard={onNavigateLeaderboard}
        showHallOfFameButton={true}
        activeStatusText="TRANSMISSION LOGGED"
      />

      <main className="thankyou-main">
        <div className="thankyou-content-card">
          <div className="emblem-wrapper">
            <VoidEmblem size={170} />
          </div>

          <div className="club-identity-tag">
            • VOIDWARE // COMPUTER SCIENCE CLUB
          </div>

          <h1 className="thankyou-hero-title">
            THANK YOU FOR ENTERING THE VOID.
          </h1>

          <blockquote className="quote-text">
            “Every great mind starts with curiosity.”
          </blockquote>

          <p className="thankyou-desc">
            Thanks for playing <strong>BUTTON PANIC</strong> and being part of
            the VOIDWARE community today. Build fearlessly, break barriers, and
            explore the unknown.
          </p>

          <div className="calibrate-pill">
            <span className="code-prefix">&lt;/&gt;</span>
            <span>LET THE VOID CALIBRATE YOU. //</span>
          </div>

          {/* Social and Community Nodes */}
          <div className="community-nodes-section">
            <div className="nodes-title">// TELEMETRY &amp; COMMUNITY NODES</div>

            <div className="social-pills-row">
              <a
                href="https://www.instagram.com/voidware.club?cplk=MWNqazB1cWF6M3JpcA=="
                target="_blank"
                rel="noreferrer"
                className="social-node-pill"
                onClick={() => soundFX.playClick()}
              >
                <span className="node-dot">•</span>
                <span>INSTAGRAM // voidware.club</span>
              </a>

              <a
                href="https://github.com/V0IDWARE-club"
                target="_blank"
                rel="noreferrer"
                className="social-node-pill"
                onClick={() => soundFX.playClick()}
              >
                <span className="node-dot">•</span>
                <span>GITHUB // VOIDWARE-club</span>
              </a>

              <a
                href="https://tiktok.com/@voidware.club"
                target="_blank"
                rel="noreferrer"
                className="social-node-pill"
                onClick={() => soundFX.playClick()}
              >
                <span className="node-dot">•</span>
                <span>TIKTOK // voidware.club</span>
              </a>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="thankyou-actions">
            <button
              className="btn-back-leaderboard"
              onClick={() => {
                soundFX.playClick();
                onNavigateLeaderboard();
              }}
            >
              ← RETURN TO LEADERBOARD
            </button>

            <button
              className="btn-new-attempt"
              onClick={() => {
                soundFX.playClick();
                onRestart();
              }}
            >
              START NEW RUN / OPERATOR →
            </button>
          </div>
        </div>
      </main>

      <footer className="thankyou-bottom-footer">
        <div className="footer-left-info">
          <span className="footer-dot">•</span>
          <span>VOIDWARE CS CLUB</span>
        </div>
        <div className="thankyou-footer-credit">
          Made all by Zabour Reihana
        </div>
      </footer>
    </div>
  );
};
