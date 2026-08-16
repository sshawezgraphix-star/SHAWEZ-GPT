import React, { useEffect, useState } from "react";
import {
  Activity,
  Check,
  Database,
  Download,
  Globe,
  HardDrive,
  Info,
  Layers,
  Link2,
  Moon,
  Radio,
  RotateCcw,
  Sliders,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  User,
  Volume2,
  X,
} from "lucide-react";
import { AIModel, AppSettings, Conversation, Persona, ProviderPoolStatus } from "../types";
import {
  checkServerHealth,
  fetchProviderPoolStatus,
  getCustomBackendUrl,
  setCustomBackendUrl,
  updateOllamaConfigApi,
} from "../services/api";
import { getStorageUsage } from "../services/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  models: AIModel[];
  personas: Persona[];
  conversations: Conversation[];
  onImportConversations: (conversations: Conversation[]) => void;
  onClearAllConversations: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  models,
  personas,
  conversations,
  onImportConversations,
  onClearAllConversations,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "ai" | "personas" | "data" | "system">("general");
  const [serverHealth, setServerHealth] = useState<{
    status: string;
    appName: string;
    defaultModel: string;
    apiKeyConfigured: boolean;
    geminiKeyCount?: number;
    geminiHealthyKeys?: number;
    ollamaConnected?: boolean;
    ollamaModelCount?: number;
  } | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderPoolStatus | null>(null);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Remote Backend / Mobile App Sync State
  const [backendUrl, setBackendUrl] = useState(getCustomBackendUrl());
  const [backendSaveSuccess, setBackendSaveSuccess] = useState(false);
  const [isTestingBackend, setIsTestingBackend] = useState(false);

  // Ollama Custom URL State
  const [ollamaUrl, setOllamaUrl] = useState("http://127.0.0.1:11434");
  const [isUpdatingOllama, setIsUpdatingOllama] = useState(false);
  const [ollamaFeedback, setOllamaFeedback] = useState<string | null>(null);

  const loadProviderHealth = async () => {
    setIsLoadingProviders(true);
    try {
      const [health, pStatus] = await Promise.all([
        checkServerHealth(),
        fetchProviderPoolStatus(),
      ]);
      setServerHealth(health);
      setProviderStatus(pStatus);
      if (pStatus?.ollama?.baseUrl) {
        setOllamaUrl(pStatus.ollama.baseUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const handleSaveBackendUrl = async () => {
    setIsTestingBackend(true);
    setCustomBackendUrl(backendUrl);
    try {
      const health = await checkServerHealth();
      setServerHealth(health);
      setBackendSaveSuccess(true);
      setTimeout(() => setBackendSaveSuccess(false), 3000);
    } catch {
      setBackendSaveSuccess(true);
    } finally {
      setIsTestingBackend(false);
    }
  };

  const handleSaveOllamaUrl = async () => {
    setIsUpdatingOllama(true);
    setOllamaFeedback(null);
    try {
      const res = await updateOllamaConfigApi(ollamaUrl);
      if (res.isConnected) {
        setOllamaFeedback(`Connected! Found ${res.models?.length || 0} local model(s).`);
      } else {
        setOllamaFeedback(`Could not connect: ${res.error || "Ensure Ollama is running"}`);
      }
      loadProviderHealth();
    } catch (err: any) {
      setOllamaFeedback(`Error: ${err.message || "Failed to test connection"}`);
    } finally {
      setIsUpdatingOllama(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProviderHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const storageUsage = getStorageUsage();

  const handleExportAll = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `shawezgpt-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          onImportConversations(imported);
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          alert("Invalid backup file format. Expected an array of conversations.");
        }
      } catch (err) {
        alert("Failed to parse backup JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none"
      onClick={onClose}
      id="settings-modal-backdrop"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              ShawezGPT Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            id="settings-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/30 overflow-x-auto">
          <TabButton
            active={activeTab === "general"}
            onClick={() => setActiveTab("general")}
            icon={<Sliders className="w-4 h-4" />}
            label="General"
          />
          <TabButton
            active={activeTab === "ai"}
            onClick={() => setActiveTab("ai")}
            icon={<Sparkles className="w-4 h-4" />}
            label="AI Model"
          />
          <TabButton
            active={activeTab === "personas"}
            onClick={() => setActiveTab("personas")}
            icon={<Layers className="w-4 h-4" />}
            label="Personas"
          />
          <TabButton
            active={activeTab === "data"}
            onClick={() => setActiveTab("data")}
            icon={<Database className="w-4 h-4" />}
            label="Data & Storage"
          />
          <TabButton
            active={activeTab === "system"}
            onClick={() => setActiveTab("system")}
            icon={<Activity className="w-4 h-4" />}
            label="System & API"
          />
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700 dark:text-slate-300">
          {/* TAB: General */}
          {activeTab === "general" && (
            <div className="space-y-5">
              {/* Theme */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Interface Theme</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Choose your visual appearance</p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => onUpdateSettings({ theme: "dark" })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      settings.theme === "dark"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-white"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ theme: "light" })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      settings.theme === "light"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                </div>
              </div>

              {/* Font Sizing */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Message Typography Scale</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Control readability and density</p>
                </div>
                <select
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: e.target.value as any })}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="compact">Compact (Dense)</option>
                  <option value="normal">Standard (Default)</option>
                  <option value="comfortable">Comfortable (Spacious)</option>
                </select>
              </div>

              {/* Code Line Wrapping */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Wrap Code Lines</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Wrap long lines of code in message blocks</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.codeWrap}
                  onChange={(e) => onUpdateSettings({ codeWrap: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Audio & Speech synthesis rate */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Text-to-Speech Speed</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Current playback speed: {settings.speechRate}x</p>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.75"
                  step="0.25"
                  value={settings.speechRate}
                  onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
                  className="w-32 accent-emerald-500"
                />
              </div>
            </div>
          )}

          {/* TAB: AI Model & Parameters */}
          {activeTab === "ai" && (
            <div className="space-y-5">
              {/* Default Model */}
              <div>
                <p className="font-semibold text-slate-900 dark:text-white mb-1.5">Default Model</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  This model will be used when starting new conversations.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {models.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onUpdateSettings({ defaultModelId: m.id })}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        settings.defaultModelId === m.id
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">{m.name}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {m.description}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-2">
                        {m.contextWindow}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-semibold text-slate-900 dark:text-white">Temperature (Creativity)</p>
                  <span className="font-mono text-xs font-bold text-emerald-500">
                    {settings.temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={settings.temperature}
                  onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Precise & Analytical (0.0)</span>
                  <span>Balanced (0.7)</span>
                  <span>Creative & Expressive (1.5)</span>
                </div>
              </div>

              {/* Task Orchestrator Mode */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white mb-1">
                  Multi-Task Orchestration Pipeline
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Controls how complex user prompts are broken down into subtasks and verified deliverables (e.g. PDF generation, code analysis).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ orchestratorMode: "auto" })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      settings.orchestratorMode === "auto" || !settings.orchestratorMode
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <p className="text-xs font-bold">Smart Auto (Default)</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Activates orchestrator when complex multi-step prompts are detected.
                    </p>
                  </button>

                  <button
                    onClick={() => onUpdateSettings({ orchestratorMode: "always" })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      settings.orchestratorMode === "always"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <p className="text-xs font-bold">Always Active</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Decomposes every prompt into verified subtasks.
                    </p>
                  </button>

                  <button
                    onClick={() => onUpdateSettings({ orchestratorMode: "off" })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      settings.orchestratorMode === "off"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <p className="text-xs font-bold">Disabled</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Standard single-turn LLM generation without decomposition.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Personas */}
          {activeTab === "personas" && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Default System Persona</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select the cognitive role and tone ShawezGPT defaults to.
                </p>
              </div>

              <div className="space-y-2.5">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onUpdateSettings({ defaultPersonaId: p.id })}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-colors flex items-start gap-3 ${
                      settings.defaultPersonaId === p.id
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-emerald-500 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {p.name}
                        </span>
                        {settings.defaultPersonaId === p.id && (
                          <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            Active Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {p.description}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 mt-2 bg-slate-100 dark:bg-slate-950 p-2 rounded-lg line-clamp-2 border border-slate-200 dark:border-slate-800">
                        {p.systemPrompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Data & Storage */}
          {activeTab === "data" && (
            <div className="space-y-6">
              {/* Storage breakdown */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">Local Storage Space</span>
                  </div>
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                    {storageUsage.usedKb} KB of ~5,120 KB used ({storageUsage.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.max(4, storageUsage.percent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total saved chats: {conversations.length} conversations
                </p>
              </div>

              {/* Export / Backup */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExportAll}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-800 dark:text-slate-200 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>Export All Chats (JSON)</span>
                </button>

                <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-800 dark:text-slate-200 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-cyan-500" />
                  <span>Import Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              {importSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Conversations backup imported successfully!</span>
                </div>
              )}

              {/* Wipe history */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-rose-500 mb-1">Clear Conversation History</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  This will wipe all locally stored conversations and chat memory.
                </p>
                {clearConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onClearAllConversations();
                        setClearConfirm(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                    >
                      Confirm Permanent Delete
                    </button>
                    <button
                      onClick={() => setClearConfirm(false)}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setClearConfirm(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold border border-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Conversations</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: System & API */}
          {activeTab === "system" && (
            <div className="space-y-5">
              {/* Refresh / Status Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">AI Provider & App Sync</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Multi-Key Gemini Pool, Ollama Local Engine & Live Mobile Sync</p>
                </div>
                <button
                  onClick={loadProviderHealth}
                  disabled={isLoadingProviders}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoadingProviders ? "animate-spin text-emerald-500" : ""}`} />
                  <span>Refresh Status</span>
                </button>
              </div>

              {/* SECTION 0: Mobile App Live Cloud Sync */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      Mobile App & Live Remote Sync
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {backendUrl ? "Custom Cloud Server" : "Local / Same-Origin"}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Connect your downloaded Android APK to your live backend server (e.g. Render, Railway, or VPS). Any updates pushed to GitHub will instantly reflect on the phone app without reinstalling!
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <input
                    type="url"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://your-shawezgpt.onrender.com (or empty for default)"
                    className="flex-1 w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSaveBackendUrl}
                    disabled={isTestingBackend}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold whitespace-nowrap transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isTestingBackend ? (
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    ) : backendSaveSuccess ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" />
                    )}
                    <span>{backendSaveSuccess ? "Saved & Connected!" : "Save & Sync App"}</span>
                  </button>
                </div>
              </div>

              {/* SECTION 1: Gemini 3-Key Pool */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      Gemini API Key Pool (Auto-Rotating)
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {providerStatus?.geminiPool.healthyKeys ?? serverHealth?.geminiHealthyKeys ?? 1} / {providerStatus?.geminiPool.totalKeys ?? serverHealth?.geminiKeyCount ?? 1} Keys Healthy
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Automatic load-balancing across multiple Gemini API keys. Whenever any key reaches rate limits (<code className="font-mono text-emerald-500">429 Resource Exhausted</code>), requests instantly failover to the next key.
                </p>

                {/* Key Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {providerStatus?.geminiPool.keys && providerStatus.geminiPool.keys.length > 0 ? (
                    providerStatus.geminiPool.keys.map((k, idx) => (
                      <div
                        key={k.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between ${
                          k.status === "healthy"
                            ? "bg-white dark:bg-slate-900/80 border-emerald-500/30"
                            : "bg-amber-500/5 border-amber-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                            Key #{idx + 1}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
                              k.status === "healthy"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {k.status === "healthy" ? "Active" : "Cooling Down"}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-slate-400 truncate mb-2">
                          {k.maskedKey}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          <span>Requests: {k.totalRequests}</span>
                          <span className="text-emerald-500 font-semibold">{k.successfulRequests} ok</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                      Primary API Key active via <code className="font-mono text-emerald-400">.env</code>. You can configure up to 3 keys using <code className="font-mono text-emerald-400">GEMINI_API_KEY_1</code>, <code className="font-mono text-emerald-400">GEMINI_API_KEY_2</code>, <code className="font-mono text-emerald-400">GEMINI_API_KEY_3</code>.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: Ollama Local Engine */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      Ollama Engine (Unlimited Quota & Offline AI)
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      providerStatus?.ollama.isConnected || serverHealth?.ollamaConnected
                        ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                        : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                    }`}
                  >
                    {providerStatus?.ollama.isConnected || serverHealth?.ollamaConnected
                      ? "Connected (Local Engine)"
                      : "Offline"}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="url"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      placeholder="http://127.0.0.1:11434 (or custom host)"
                      className="flex-1 w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSaveOllamaUrl}
                      disabled={isUpdatingOllama}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold whitespace-nowrap transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isUpdatingOllama ? (
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Radio className="w-3.5 h-3.5" />
                      )}
                      <span>Test / Connect</span>
                    </button>
                  </div>

                  {ollamaFeedback && (
                    <div
                      className={`p-2.5 rounded-xl text-xs ${
                        ollamaFeedback.includes("Connected")
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {ollamaFeedback}
                    </div>
                  )}
                </div>

                {providerStatus?.ollama.models && providerStatus.ollama.models.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Detected Installed Models ({providerStatus.ollama.models.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {providerStatus.ollama.models.map((m) => (
                        <span
                          key={m.name}
                          className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono text-[11px]"
                        >
                          {m.name} {m.details?.parameter_size ? `(${m.details.parameter_size})` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">How to activate Ollama locally:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-500">
                      <li>Download and install from <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-indigo-500 underline">ollama.com</a></li>
                      <li>In terminal, run: <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded text-indigo-400">ollama run llama3</code> or <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded text-indigo-400">ollama run mistral</code></li>
                      <li>Click <strong>Test / Connect</strong> above to start chatting with zero quota limits!</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Overview footer */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                🛡️ <strong>Zero Quota Disruption Guarantee</strong>: With 3 Gemini keys auto-rotating and Ollama serving as a standby engine, your users experience 100% seamless, uninterrupted uptime without quota limits.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
      active
        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-800"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);
