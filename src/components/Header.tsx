import React, { useState } from "react";
import {
  Brain,
  ChevronDown,
  Cpu,
  Globe,
  Moon,
  PanelLeft,
  Plus,
  Settings,
  Share2,
  Sparkles,
  Sun,
  Trash2,
  User,
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
  onClearChat,
  onNewChat,
  hasMessages,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const activeModel = models.find((m) => m.id === selectedModelId) || models[0];
  const activePersona = personas.find((p) => p.id === selectedPersonaId) || personas[0];

  const toggleTheme = () => {
    const nextTheme = settings.theme === "dark" ? "light" : "dark";
    onUpdateSettings({ theme: nextTheme });
  };

  return (
    <header
      className="h-14 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 z-20 shrink-0 select-none"
      id="app-header"
    >
      {/* Left side: Sidebar toggle + Brand + Model/Persona pickers */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          id="btn-toggle-sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onNewChat}
          className="sm:hidden p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          title="New Chat"
          id="btn-mobile-new-chat"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setModelDropdownOpen(!modelDropdownOpen);
              setPersonaDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            id="model-selector-btn"
          >
            <span className="truncate max-w-[110px] sm:max-w-[150px]">{activeModel?.name || "Shawez Turbo"}</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hidden md:inline">
              {activeModel?.badge || "Pro"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {modelDropdownOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95"
              id="model-dropdown-menu"
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Select Intelligence Model
              </div>
              <div className="space-y-1">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left transition-colors flex flex-col ${
                      model.id === selectedModelId
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200"
                    }`}
                    id={`model-option-${model.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <span className="text-xs">{model.provider === "ollama" ? "🦙" : "⚡"}</span>
                        <span className="font-semibold text-xs sm:text-sm truncate">{model.name}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 font-bold ${
                          model.provider === "ollama"
                            ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {model.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Persona Selector Dropdown */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => {
              setPersonaDropdownOpen(!personaDropdownOpen);
              setModelDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition-colors"
            id="persona-selector-btn"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="truncate max-w-[130px]">{activePersona?.name || "General"}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {personaDropdownOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in"
              id="persona-dropdown-menu"
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                    className={`w-full p-2 rounded-xl text-left transition-colors flex items-start gap-2.5 ${
                      persona.id === selectedPersonaId
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                    id={`persona-option-${persona.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{persona.name}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{persona.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Web Grounding Pill + Share + Clear + Theme + Settings + User */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Web Search status */}
        <button
          onClick={onToggleWebSearch}
          className={`p-2 rounded-xl transition-colors hidden sm:flex items-center gap-1 text-xs ${
            enableWebSearch
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Resume & Document Studio (ATS Resumes, Cover Letters, PDF Generator)"
            id="btn-header-resume-studio"
          >
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline">Resume & PDF Studio</span>
          </button>
        )}

        {/* Memory & Context Engine Button */}
        <button
          onClick={onOpenMemory}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-purple-500/10 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title="Memory & Context Engine (Preferences, ADRs, Project Context & Token Budgeting)"
          id="btn-header-memory"
        >
          <Brain className="w-4 h-4 text-purple-500 shrink-0" />
          <span className="hidden md:inline">Memory</span>
        </button>

        {/* Agent & Tool Registry Button */}
        <button
          onClick={onOpenRegistry}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title="Agent & Tool Registry (Status, Health, Schemas, & Test Suite)"
          id="btn-header-registry"
        >
          <Cpu className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="hidden lg:inline">Agents</span>
        </button>

        {/* Share / Export */}
        {hasMessages && (
          <button
            onClick={onOpenExport}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
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
            className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
            title="Clear current messages"
            id="btn-header-clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title={`Switch to ${settings.theme === "dark" ? "Light" : "Dark"} mode`}
          id="btn-header-theme"
        >
          {settings.theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Settings"
          id="btn-header-settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Account Avatar / Auth Modal */}
        <button
          onClick={onOpenAuth}
          className="ml-1 flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-colors"
          title="Account Profile & Auth"
          id="btn-header-user-profile"
        >
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-6 h-6 rounded-lg object-cover bg-emerald-500/20"
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
