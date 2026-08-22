import React, { useEffect, useRef, useState } from "react";
import {
  Brain,
  Check,
  ChevronDown,
  Cpu,
  Globe,
  Moon,
  PanelLeft,
  Plus,
  Image as ImageIcon,
  Search,
  Settings,
  Share2,
  Sparkles,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";
import { AIModel, AppSettings, Persona, UserProfile } from "../types";
import { BrandLogo } from "./BrandLogo";

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  models: AIModel[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  personas: Persona[];
  selectedPersonaId: string;
  onSelectPersona: (id: string) => void;
  enableWebSearch: boolean;
  onToggleWebSearch: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  user: UserProfile;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenExport: () => void;
  onOpenRegistry: () => void;
  onOpenMemory: () => void;
  onOpenResumeStudio?: () => void;
  onOpenImageStudio?: () => void;
  onClearChat: () => void;
  onNewChat: () => void;
  hasMessages: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  models,
  selectedModelId,
  onSelectModel,
  personas,
  selectedPersonaId,
  onSelectPersona,
  enableWebSearch,
  onToggleWebSearch,
  settings,
  onUpdateSettings,
  user,
  onOpenSettings,
  onOpenAuth,
  onOpenExport,
  onOpenRegistry,
  onOpenMemory,
  onOpenResumeStudio,
  onOpenImageStudio,
  onClearChat,
  onNewChat,
  hasMessages,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<"all" | "flagship" | "ruflo" | "ollama">("all");

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const personaDropdownRef = useRef<HTMLDivElement>(null);

  const activeModel = models.find((m) => m.id === selectedModelId) || models[0];
  const activePersona = personas.find((p) => p.id === selectedPersonaId) || personas[0];

  // Outside click listener to dismiss dropdowns seamlessly
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(e.target as Node)
      ) {
        setModelDropdownOpen(false);
      }
      if (
        personaDropdownRef.current &&
        !personaDropdownRef.current.contains(e.target as Node)
      ) {
        setPersonaDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const toggleTheme = () => {
    const nextTheme = settings.theme === "dark" ? "light" : "dark";
    onUpdateSettings({ theme: nextTheme });
  };

  // Filter models based on search and active tab
  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategoryTab === "flagship") {
      return !m.id.includes("ruflo") && m.provider !== "ollama";
    }
    if (activeCategoryTab === "ruflo") {
      return m.id.includes("ruflo");
    }
    if (activeCategoryTab === "ollama") {
      return m.provider === "ollama" || m.id.startsWith("ollama:");
    }
    return true;
  });

  return (
    <header
      className="h-14 border-b border-white/10 bg-[#050508]/95 backdrop-blur-2xl flex items-center justify-between px-3 sm:px-4 z-30 shrink-0 select-none shadow-[0_4px_24px_rgba(0,0,0,0.9)]"
      id="app-header"
    >
      {/* Left side: Sidebar toggle + Brand + Model/Persona pickers */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10 cursor-pointer"
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          id="btn-toggle-sidebar"
        >
          <PanelLeft className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={onNewChat}
          className="sm:hidden p-2 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer"
          title="New Chat"
          id="btn-mobile-new-chat"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Model Selector Dropdown (ChatGPT-Style) */}
        <div className="relative" ref={modelDropdownRef}>
          <button
            onClick={() => {
              setModelDropdownOpen(!modelDropdownOpen);
              setPersonaDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e0e14] hover:bg-[#151520] text-zinc-100 text-xs sm:text-sm font-semibold transition-all border border-white/10 hover:border-emerald-500/40 shadow-xs group cursor-pointer"
            id="model-selector-btn"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-[170px]">
              {activeModel?.name || "OmniRoute AI"}
            </span>
            <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hidden md:inline">
              {activeModel?.badge || "Pro"}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform ${modelDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {modelDropdownOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#09090d]/98 backdrop-blur-3xl border border-white/15 shadow-[0_16px_50px_rgba(0,0,0,0.98)] p-2.5 z-50 animate-in fade-in zoom-in-95"
              id="model-dropdown-menu"
            >
              {/* Dropdown Header & Category Tabs */}
              <div className="pb-2 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    Model Intelligence Core
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Zero-Limit 4M T/min
                  </span>
                </div>

                {/* Search in models */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    placeholder="Search AI models & swarms..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0e0e14] border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  <button
                    onClick={() => setActiveCategoryTab("all")}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      activeCategoryTab === "all"
                        ? "bg-white/15 text-white font-bold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    All ({models.length})
                  </button>
                  <button
                    onClick={() => setActiveCategoryTab("flagship")}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      activeCategoryTab === "flagship"
                        ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    ✨ Flagships
                  </button>
                  <button
                    onClick={() => setActiveCategoryTab("ruflo")}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      activeCategoryTab === "ruflo"
                        ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    🤖 Ruflo Swarm
                  </button>
                  <button
                    onClick={() => setActiveCategoryTab("ollama")}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      activeCategoryTab === "ollama"
                        ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    🦙 Ollama
                  </button>
                </div>
              </div>

              {/* Scrollable Model List */}
              <div className="space-y-1 mt-2 max-h-[340px] overflow-y-auto pr-1">
                {filteredModels.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    No matching AI models found.
                  </div>
                ) : (
                  filteredModels.map((model) => {
                    const isSelected = model.id === selectedModelId;
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          setModelDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex flex-col cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]"
                            : "hover:bg-white/5 text-zinc-200 border border-transparent hover:border-white/10"
                        }`}
                        id={`model-option-${model.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-xs">
                              {model.id.includes("omni")
                                ? "🌐"
                                : model.id.includes("ruflo")
                                ? "🤖"
                                : model.provider === "ollama"
                                ? "🦙"
                                : "⚡"}
                            </span>
                            <span className="font-bold text-xs sm:text-sm truncate">
                              {model.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                model.id.includes("omni")
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  : model.id.includes("ruflo")
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : model.provider === "ollama"
                                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                  : "bg-white/10 text-zinc-300 border border-white/10"
                              }`}
                            >
                              {model.badge}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                          {model.description}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Persona Selector Dropdown */}
        <div className="relative hidden lg:block" ref={personaDropdownRef}>
          <button
            onClick={() => {
              setPersonaDropdownOpen(!personaDropdownOpen);
              setModelDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors border border-transparent hover:border-white/10 cursor-pointer"
            id="persona-selector-btn"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[130px]">{activePersona?.name || "General"}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {personaDropdownOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-[#09090d]/98 backdrop-blur-3xl border border-white/15 shadow-[0_16px_50px_rgba(0,0,0,0.98)] p-2 z-50 animate-in fade-in"
              id="persona-dropdown-menu"
            >
              <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Active System Persona
              </div>
              <div className="space-y-1">
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => {
                      onSelectPersona(persona.id);
                      setPersonaDropdownOpen(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left transition-colors flex items-start gap-2.5 cursor-pointer ${
                      persona.id === selectedPersonaId
                        ? "bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/30"
                        : "hover:bg-white/5 text-zinc-300 border border-transparent"
                    }`}
                    id={`persona-option-${persona.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{persona.name}</p>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{persona.description}</p>
                    </div>
                    {persona.id === selectedPersonaId && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Telemetry Badge + Tools + Theme + User */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Live Zero-Limit Status Pill (High-Tech Badge) */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0c0c12] border border-white/10 text-[10px] font-mono text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Zero-Limit Pool</span>
          <span className="text-emerald-400 font-bold">4M T/min</span>
        </div>

        {/* Web Search status */}
        <button
          onClick={onToggleWebSearch}
          className={`p-2 rounded-xl transition-all flex items-center gap-1 text-xs border cursor-pointer ${
            enableWebSearch
              ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
              : "hover:bg-white/5 text-zinc-400 hover:text-zinc-200 border-transparent hover:border-white/10"
          }`}
          title={enableWebSearch ? "Search Grounding On" : "Enable Web Search Grounding"}
          id="header-web-search-btn"
        >
          <Globe className="w-4 h-4" />
        </button>

        {/* Resume & Document Studio Button */}
        {onOpenResumeStudio && (
          <button
            onClick={onOpenResumeStudio}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs cursor-pointer"
            title="Resume & Document Studio (ATS Resumes, Cover Letters, PDF Generator)"
            id="btn-header-resume-studio"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">PDF Studio</span>
          </button>
        )}

        {/* AI Image Studio & Editor Button */}
        {onOpenImageStudio && (
          <button
            onClick={onOpenImageStudio}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs cursor-pointer"
            title="AI Image Studio & Editor (100% Free Flux / Canvas Image Editing)"
            id="btn-header-image-studio"
          >
            <ImageIcon className="w-4 h-4 text-pink-400 shrink-0" />
            <span className="hidden sm:inline">Image Studio</span>
          </button>
        )}

        {/* Memory & Context Engine Button */}
        <button
          onClick={onOpenMemory}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          title="Memory & Context Engine (Preferences, ADRs, Project Context & Token Budgeting)"
          id="btn-header-memory"
        >
          <Brain className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="hidden md:inline">Memory</span>
        </button>

        {/* Agent & Tool Registry Button */}
        <button
          onClick={onOpenRegistry}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          title="Agent & Tool Registry (Status, Health, Schemas, & Test Suite)"
          id="btn-header-registry"
        >
          <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="hidden lg:inline">Agents</span>
        </button>

        {/* Share / Export */}
        {hasMessages && (
          <button
            onClick={onOpenExport}
            className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors border border-transparent hover:border-white/10 cursor-pointer"
            title="Export or Share Chat"
            id="btn-header-export"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}

        {/* Clear Chat */}
        {hasMessages && (
          <button
            onClick={onClearChat}
            className="p-2 rounded-xl hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
            title="Clear current messages"
            id="btn-header-clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors border border-transparent hover:border-white/10 cursor-pointer"
          title={`Switch to ${settings.theme === "dark" ? "Light" : "Dark"} mode`}
          id="btn-header-theme"
        >
          {settings.theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-400" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors border border-transparent hover:border-white/10 cursor-pointer"
          title="Settings"
          id="btn-header-settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Account Avatar / Auth Modal */}
        <button
          onClick={onOpenAuth}
          className="ml-1 flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-[#0e0e14] hover:bg-[#151520] text-zinc-200 border border-white/10 hover:border-emerald-500/40 transition-colors cursor-pointer"
          title="Account Profile & Auth"
          id="btn-header-user-profile"
        >
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-6 h-6 rounded-lg object-cover bg-emerald-500/20 border border-emerald-500/30"
            referrerPolicy="no-referrer"
          />
          <span className="text-xs font-semibold max-w-[80px] sm:max-w-[100px] truncate hidden md:inline">
            {user.name}
          </span>
        </button>
      </div>
    </header>
  );
};
