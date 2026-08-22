import React from "react";
import {
  ArrowRight,
  BrainCircuit,
  Code2,
  Cpu,
  FileText,
  Globe,
  ImageIcon,
  Lightbulb,
  Shield,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { STARTER_PROMPTS, StarterPrompt } from "../data/models";

interface WelcomeScreenProps {
  onSelectPrompt: (promptText: string) => void;
  activeModelName?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectPrompt,
  activeModelName = "Shawez Turbo 3.7",
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Code2":
        return <Code2 className="w-5 h-5 text-emerald-400" />;
      case "FileText":
        return <FileText className="w-5 h-5 text-teal-400" />;
      case "BrainCircuit":
        return <BrainCircuit className="w-5 h-5 text-cyan-400" />;
      case "Lightbulb":
        return <Lightbulb className="w-5 h-5 text-amber-400" />;
      case "Smartphone":
        return <Smartphone className="w-5 h-5 text-emerald-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full text-center select-none" id="welcome-screen">
      {/* Visual Futuristic Logo Center */}
      <div className="mb-6 flex flex-col items-center animate-in fade-in zoom-in duration-300">
        <div className="relative mb-4">
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse-glow" />
          <BrandLogo size="lg" showText={false} />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span>Welcome to</span>
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]">
            ShawezGPT
          </span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed">
          Ultra-advanced agentic intelligence with <span className="text-emerald-400 font-semibold">Zero-Limit Multi-Key Engine</span>, <span className="text-cyan-400 font-semibold">Ruflo 6-AI Swarm</span>, and native Multimodal Vision.
        </p>

        {/* High-Tech Telemetry Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0c0c12] border border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>4M Tokens/Min Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0c0c12] border border-purple-500/30 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Ruflo 6-AI Swarm</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0c0c12] border border-cyan-500/30 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Web Grounding</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0c0c12] border border-pink-500/30 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.15)]">
            <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>Flux Image Studio</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0c0c12] border border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>15-Layer Hardened</span>
          </div>
        </div>
      </div>

      {/* Futuristic Starter Prompts Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-left max-w-2xl">
        {STARTER_PROMPTS.map((starter: StarterPrompt) => (
          <button
            key={starter.id}
            onClick={() => onSelectPrompt(starter.prompt)}
            className="group p-3.5 rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 hover:border-emerald-500/50 hover:bg-[#12121a] hover:shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.15)] transition-all duration-200 flex items-start gap-3.5 text-left"
            id={`starter-btn-${starter.id}`}
          >
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 group-hover:scale-105 group-hover:bg-emerald-500/15 group-hover:border-emerald-500/30 transition-all">
              {getIcon(starter.iconName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                  {starter.title}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                {starter.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
