import React, { useState } from "react";
import logoImg from "../../assets/v0idware-icon.png";
import { soundFX } from "../../utils/soundEffects";
import { formatPlayerId } from "../../utils/formatters";
import "./header.css";

interface HeaderProps {
  operatorName?: string;
  operatorId?: string;
  onNavigateLeaderboard?: () => void;
  showHallOfFameButton?: boolean;
  activeStatusText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  operatorName,
  operatorId,
  onNavigateLeaderboard,
  showHallOfFameButton = true,
  activeStatusText = "PROTOCOL ACTIVE // 60 FPS",
}) => {
  const [isMuted, setIsMuted] = useState(soundFX.getMuted());

  const handleToggleSound = () => {
    const muted = soundFX.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundFX.playClick();
    }
  };

  const formattedId = formatPlayerId(operatorId);

  return (
    <header className="void-header">
      <div className="void-header-left">
        <div className="void-logo-box">
          <img src={logoImg} alt="VOIDWARE" className="void-logo-img" />
        </div>
        <div className="void-title-group">
          <div className="void-brand-row">
            <span className="void-brand-name">VOIDWARE</span>
          </div>
          <span className="void-sub-protocol">
            BUTTON PANIC // PROTOCOL
          </span>
        </div>
      </div>

      <div className="void-header-right">
        {operatorName && (
          <div className="void-pill void-op-badge" title={`Player ID: ${operatorId || ''}`}>
            <span className="mono-muted">// OP:</span>{" "}
            <strong className="op-highlight">{operatorName}</strong>{" "}
            <span className="mono-muted">ID:</span>{" "}
            <span className="id-highlight">{formattedId}</span>
          </div>
        )}

        <div className="void-pill void-status-badge">
          <span className="status-dot"></span>
          <span>{activeStatusText}</span>
        </div>

        {showHallOfFameButton && onNavigateLeaderboard && (
          <button
            className="void-btn-hall-of-fame"
            onClick={() => {
              soundFX.playClick();
              onNavigateLeaderboard();
            }}
            title="View Hall of Fame"
          >
            <span className="icon-trophy">⚑</span>
            <span>HALL OF FAME</span>
          </button>
        )}

        <button
          className={`void-btn-sound ${isMuted ? "muted" : ""}`}
          onClick={handleToggleSound}
          title={isMuted ? "Unmute Audio" : "Mute Audio"}
          aria-label="Toggle Sound"
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>
    </header>
  );
};
