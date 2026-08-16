import React from "react";

interface NeuralSLogoProps {
  className?: string;
  size?: number | string;
  glow?: boolean;
}

/**
 * Custom Geometric Neural-Network "S" Icon
 * - Formed by connected neural nodes and precise geometric synaptic pathways.
 * - Deep navy (#070b19 / #0b132b) background canvas.
 * - Electric cyan/blue (#00d2ff, #00f0ff, #38bdf8) with vivid violet/purple (#8b5cf6, #a855f7) accents.
 * - Unique custom geometry: Not imitating ChatGPT, Gemini, or Claude.
 */
export const NeuralSIcon: React.FC<NeuralSLogoProps> = ({
  className = "",
  size = 36,
  glow = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 overflow-visible transition-transform duration-200 ${className}`}
      id="neural-s-mark"
    >
      <defs>
        {/* Glow Filters */}
        {glow && (
          <>
            <filter id="electricGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="softPurpleGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </>
        )}

        {/* Linear Gradients */}
        <linearGradient id="navyCanvasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a0f24" />
          <stop offset="50%" stopColor="#070c1d" />
          <stop offset="100%" stopColor="#040711" />
        </linearGradient>

        <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0066ff" stopOpacity="0.8" />
        </linearGradient>

        <linearGradient id="pathGradientTop" x1="80" y1="20" x2="20" y2="48">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="60%" stopColor="#0099ff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        <linearGradient id="pathGradientBottom" x1="20" y1="52" x2="80" y2="80">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="40%" stopColor="#0099ff" />
          <stop offset="100%" stopColor="#00f0ff" />
        </linearGradient>

        <linearGradient id="coreDiagonal" x1="26" y1="48" x2="74" y2="52">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#00f0ff" />
        </linearGradient>

        <radialGradient id="nodeGlowCyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#0088ff" />
        </radialGradient>

        <radialGradient id="nodeGlowPurple" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </radialGradient>
      </defs>

      {/* Outer Hex-Squircle Base with Navy Hue */}
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="26"
        fill="url(#navyCanvasGrad)"
        stroke="url(#borderGrad)"
        strokeWidth="2.5"
      />

      {/* Subtle Background Neural Mesh Grid */}
      <g opacity="0.18">
        <line x1="24" y1="24" x2="76" y2="76" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="76" y1="24" x2="24" y2="76" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="32" stroke="#00d2ff" strokeWidth="0.75" strokeDasharray="4 4" />
      </g>

      {/* The Neural Synapse Pathways forming letter 'S' */}
      {/* Upper S-Loop: Start (76, 24) -> (46, 20) -> (24, 34) -> (36, 48) -> (64, 52) */}
      <path
        d="M 76 24 L 46 20 L 25 34 L 32 48 L 68 52"
        stroke="url(#pathGradientTop)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glow ? "url(#electricGlow)" : undefined}
      />

      {/* Lower S-Loop: Bridge (32, 48) -> (68, 52) -> (75, 66) -> (54, 80) -> (24, 76) */}
      <path
        d="M 32 48 L 68 52 L 75 66 L 54 80 L 24 76"
        stroke="url(#pathGradientBottom)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glow ? "url(#electricGlow)" : undefined}
      />

      {/* Neural Core Cross-Bridge Interconnector */}
      <line
        x1="32"
        y1="48"
        x2="68"
        y2="52"
        stroke="url(#coreDiagonal)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Synaptic Data Pulses along lines */}
      <circle cx="58" cy="21.5" r="2" fill="#ffffff" opacity="0.9" />
      <circle cx="28" cy="40" r="1.8" fill="#c084fc" opacity="0.9" />
      <circle cx="50" cy="50" r="2.5" fill="#ffffff" opacity="0.95" />
      <circle cx="72" cy="60" r="1.8" fill="#38bdf8" opacity="0.9" />
      <circle cx="40" cy="78.5" r="2" fill="#ffffff" opacity="0.9" />

      {/* Neural Network Node Clusters */}
      {/* Node 1: Top-Right Entry */}
      <circle cx="76" cy="24" r="5" fill="url(#nodeGlowCyan)" />
      <circle cx="76" cy="24" r="2.2" fill="#ffffff" />

      {/* Node 2: Top-Center Node */}
      <circle cx="46" cy="20" r="4.2" fill="url(#nodeGlowCyan)" />
      <circle cx="46" cy="20" r="1.8" fill="#ffffff" />

      {/* Node 3: Upper-Left Elbow */}
      <circle cx="25" cy="34" r="4.8" fill="url(#nodeGlowPurple)" />
      <circle cx="25" cy="34" r="2" fill="#ffffff" />

      {/* Node 4: Mid-Left Neural Junction */}
      <circle cx="32" cy="48" r="5.5" fill="url(#nodeGlowPurple)" />
      <circle cx="32" cy="48" r="2.5" fill="#ffffff" />

      {/* Node 5: Central Synaptic Core */}
      <circle cx="50" cy="50" r="4" fill="url(#nodeGlowCyan)" />
      <circle cx="50" cy="50" r="1.8" fill="#ffffff" />

      {/* Node 6: Mid-Right Neural Junction */}
      <circle cx="68" cy="52" r="5.5" fill="url(#nodeGlowCyan)" />
      <circle cx="68" cy="52" r="2.5" fill="#ffffff" />

      {/* Node 7: Lower-Right Elbow */}
      <circle cx="75" cy="66" r="4.8" fill="url(#nodeGlowCyan)" />
      <circle cx="75" cy="66" r="2" fill="#ffffff" />

      {/* Node 8: Bottom-Center Node */}
      <circle cx="54" cy="80" r="4.2" fill="url(#nodeGlowPurple)" />
      <circle cx="54" cy="80" r="1.8" fill="#ffffff" />

      {/* Node 9: Bottom-Left Exit */}
      <circle cx="24" cy="76" r="5" fill="url(#nodeGlowPurple)" />
      <circle cx="24" cy="76" r="2.2" fill="#ffffff" />
    </svg>
  );
};
