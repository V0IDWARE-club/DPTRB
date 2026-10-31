import React from "react";

interface VoidEmblemProps {
  size?: number;
}

export const VoidEmblem: React.FC<VoidEmblemProps> = ({ size = 180 }) => {
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size * 0.8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
      }}
    >
      <svg
        width={size}
        height={size * 0.8}
        viewBox="0 0 240 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 0 20px rgba(168, 85, 247, 0.45))" }}
      >
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Back portion of the tilted elliptical orbital ring */}
        <ellipse
          cx="120"
          cy="90"
          rx="105"
          ry="32"
          transform="rotate(-18 120 90)"
          stroke="url(#ringGrad)"
          strokeWidth="4"
          fill="none"
          strokeDasharray="4 2"
          opacity="0.6"
        />

        {/* Outer glowing orbital ring */}
        <ellipse
          cx="120"
          cy="90"
          rx="102"
          ry="30"
          transform="rotate(-18 120 90)"
          stroke="#c084fc"
          strokeWidth="4.5"
          fill="none"
        />

        {/* Inner core circle with glowing rim */}
        <circle
          cx="120"
          cy="90"
          r="42"
          fill="#0c0926"
          stroke="#ffffff"
          strokeWidth="4.5"
        />

        {/* Inner concentric ring */}
        <circle
          cx="120"
          cy="90"
          r="36"
          fill="none"
          stroke="#a855f7"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Code brackets </ > */}
        <g stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
          {/* < */}
          <path d="M102 78 L90 90 L102 102" />
          {/* / */}
          <path d="M125 74 L115 106" stroke="#c084fc" strokeWidth="4" />
          {/* > */}
          <path d="M138 78 L150 90 L138 102" />
        </g>

        {/* Front portion of tilted orbit ring that passes in front */}
        <path
          d="M 22 115 C 38 140, 195 130, 218 68"
          stroke="#d8b4fe"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />

        {/* Floating tiny data nodes / particles */}
        <circle cx="34" cy="116" r="3.5" fill="#a855f7" />
        <circle cx="204" cy="64" r="3" fill="#60a5fa" />
        <circle cx="120" cy="16" r="2.5" fill="#c084fc" opacity="0.7" />
      </svg>
    </div>
  );
};
