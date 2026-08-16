import React from "react";
import {
  ArrowRight,
  BrainCircuit,
  Code2,
  FileText,
  Globe,
  ImageIcon,
  Lightbulb,
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
        return <Code2 className="w-5 h-5 text-emerald-500" />;
      case "FileText":
        return <FileText className="w-5 h-5 text-teal-500" />;
      case "BrainCircuit":
        return <BrainCircuit className="w-5 h-5 text-cyan-500" />;
      case "Lightbulb":
        return <Lightbulb className="w-5 h-5 text-amber-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full text-center select-none" id="welcome-screen">
      {/* Visual Logo Center */}
      <div className="mb-6 flex flex-col items-center animate-in fade-in zoom-in duration-300">
        <BrandLogo size="lg" showText={false} className="mb-4" />
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Welcome to <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">ShawezGPT</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md">
          Next-generation intelligence for coding, deep analysis, multimodal vision, and strategic thinking.
        </p>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-medium text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Streaming Tokens</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-500" />
            <span>Vision & Files</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Globe className="w-3.5 h-3.5 text-teal-500" />
            <span>Web Grounding</span>
          </div>
        </div>
      </div>

      {/* Starter Prompts Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-left max-w-2xl">
        {STARTER_PROMPTS.map((starter: StarterPrompt) => (
          <button
            key={starter.id}
            onClick={() => onSelectPrompt(starter.prompt)}
            className="group p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-md transition-all flex items-start gap-3.5 text-left"
            id={`starter-btn-${starter.id}`}
          >
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 shrink-0 group-hover:scale-105 transition-transform">
              {getIcon(starter.iconName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                  {starter.title}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {starter.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
