import React, { useEffect } from "react";
import { soundFX } from "../../utils/soundEffects";
import "./footer.css";

interface FooterProps {
  latency?: string;
  velocity?: string;
  onAbort?: () => void;
  showAbortButton?: boolean;
  rightText?: string;
}

export const Footer: React.FC<FooterProps> = ({
  latency = "142ms",
  velocity = "1.4x",
  onAbort,
  showAbortButton = true,
  rightText = "• VOIDWARE CS CLUB // SYSTEM READY",
}) => {
  useEffect(() => {
    if (!onAbort) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        soundFX.playClick();
        onAbort();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onAbort]);

  return (
    <footer className="void-footer">
      <div className="void-footer-left">
        <span className="footer-dot"></span>
        <span className="mono-stat">
          LATENCY: <strong>{latency}</strong> // VELOCITY:{" "}
          <strong>{velocity}</strong>
        </span>
      </div>

      <div className="void-footer-center">
        {showAbortButton && onAbort ? (
          <button
            className="void-btn-abort"
            onClick={() => {
              soundFX.playClick();
              onAbort();
            }}
            title="Abort current operation"
          >
            ABORT PROTOCOL [ESC]
          </button>
        ) : null}
        <span className="void-footer-credit-text">
          Made all by Zabour Reihana
        </span>
      </div>

      <div className="void-footer-right">
        <span className="mono-stat">{rightText}</span>
      </div>
    </footer>
  );
};
