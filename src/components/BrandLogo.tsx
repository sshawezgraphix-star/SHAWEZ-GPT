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
      ? "text-2xl"
      : "text-3xl";

  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3 select-none group cursor-pointer ${className}`}
      id="shawezgpt-brand-logo"
    >
      {/* ChatGPT-style Emblem */}
      <ChatGPTLogo size={pixelSize} />

      {/* Brand Wordmark */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-bold tracking-tight text-slate-900 dark:text-slate-100 ${wordmarkSize}`}
            >
              Shawez
            </span>
            <span
              className={`font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 ${wordmarkSize}`}
            >
              GPT
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

