import React from "react";
import { ChatGPTLogo } from "./ChatGPTLogo";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  showText = true,
  className = "",
}) => {
  const pixelSize = size === "sm" ? 28 : size === "md" ? 34 : size === "lg" ? 52 : 68;
  const wordmarkSize =
    size === "sm"
      ? "text-sm"
      : size === "md"
      ? "text-base sm:text-lg"
      : size === "lg"
      ? "text-2xl sm:text-3xl"
      : "text-3xl sm:text-4xl";

  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3 select-none group cursor-pointer ${className}`}
      id="shawezgpt-brand-logo"
    >
      {/* High-Tech Glowing Emblem */}
      <div className="relative flex items-center justify-center">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-2xl blur-xs group-hover:blur-sm transition-all duration-300 opacity-80 group-hover:opacity-100" />
        <div className="relative">
          <ChatGPTLogo size={pixelSize} />
        </div>
      </div>

      {/* Brand Wordmark with Futuristic Cyber Typography */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-bold tracking-tight text-white ${wordmarkSize}`}
            >
              Shawez
            </span>
            <span
              className={`font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(16,185,129,0.4)] ${wordmarkSize}`}
            >
              GPT
            </span>
            <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 tracking-wider">
              PRO
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
