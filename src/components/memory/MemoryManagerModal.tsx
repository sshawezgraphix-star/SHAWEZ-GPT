import React, { useState, useEffect } from "react";
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Play,
  RefreshCw,
  X,
  Filter,
  Sparkles,
  Layers,
  Database,
  FileCode,
  Tag,
  Sliders,
  Check,
  AlertTriangle,
  FolderGit2,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  ContextAssembly,
  MemoryApprovalStatus,
  MemoryEntry,
  MemoryPrivacy,
  MemoryStats,
  MemoryTestReport,
  MemoryType,
} from "../../types";
import {
  fetchMemoriesApi,
  fetchMemoryStatsApi,
  createMemoryApi,
  updateMemoryApi,
  deleteMemoryApi,
  approveMemoryApi,
  rejectMemoryApi,
  simulateContextRetrievalApi,
  runMemoryTestsApi,
} from "../../services/api";

interface MemoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MEMORY_TYPES: { id: MemoryType; label: string; description: string; color: string }[] = [
  {
    id: "user_preference",
    label: "User Preference",
    description: "Guidelines, formatting rules, and style preferences",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  {
    id: "decision_record",
    label: "Decision Record (ADR)",
    description: "Architectural decisions, technology choices, and trade-offs",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    id: "project_specific",
    label: "Project Specific",
    description: "Stack rules, project conventions, and domain knowledge",
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  {
    id: "file_project_context",
    label: "File & Directory Context",
    description: "Workspace layout, schema summaries, and module paths",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    id: "long_term_user",
    label: "Long-Term User",
    description: "Persistent user facts, profile details, and background",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    id: "short_term_conversation",
    label: "Short-Term Conversation",
    description: "Dynamic context window state and session turn summaries",
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
];

export function MemoryManagerModal({ isOpen, onClose }: MemoryManagerModalProps) {
  const [activeTab, setActiveTab] = useState<"explorer" | "simulator" | "privacy" | "tests">("explorer");
  const [memories, setMemories] = useState<Array<MemoryEntry & { relevanceScore?: number; matchReason?: string }>>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  // Create / Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState<MemoryType>("user_preference");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formProjectId, setFormProjectId] = useState("shawezgpt-main");
  const [formTags, setFormTags] = useState("");
  const [formImportance, setFormImportance] = useState(3);
  const [formPrivacy, setFormPrivacy] = useState<MemoryPrivacy>("public");
  const [formStatus, setFormStatus] = useState<MemoryApprovalStatus>("approved");
  const [formWarning, setFormWarning] = useState<string[]>([]);
  const [formRedacted, setFormRedacted] = useState(false);

  // Context Simulator state
  const [simQuery, setSimQuery] = useState("How should we format markdown reports and compile PDFs?");
  const [simProjectId, setSimProjectId] = useState("shawezgpt-main");
  const [simMaxTokens, setSimMaxTokens] = useState(1000);
  const [simAssembly, setSimAssembly] = useState<ContextAssembly | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Test Suite state
  const [testReport, setTestReport] = useState<MemoryTestReport | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Privacy Sanitizer tester state
  const [privacyTestInput, setPrivacyTestInput] = useState(
    'config = {\n  apiKey: "sk-abcdef1234567890abcdef1234567890",\n  googleKey: "AIzaSyD-1234567890abcdefghijklmnopqrst",\n  password: "SuperSecretPassword123!"\n}'
  );
  const [privacyTestResult, setPrivacyTestResult] = useState<{
    sanitized: string;
    redacted: boolean;
    details: string[];
  } | null>(null);

  // Load memories and stats
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedMemories, fetchedStats] = await Promise.all([
        fetchMemoriesApi({
          query: searchQuery || undefined,
          type: selectedType !== "all" ? selectedType : undefined,
          privacy: selectedPrivacy !== "all" ? selectedPrivacy : undefined,
          approvalStatus: selectedStatus !== "all" ? selectedStatus : undefined,
          projectId: selectedProject !== "all" ? selectedProject : undefined,
          includePending: true,
        }),
        fetchMemoryStatsApi(),
      ]);
      setMemories(fetchedMemories);
      if (fetchedStats) {
        setStats(fetchedStats.stats);
      }
    } catch (err) {
      console.error("Failed to load memory data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, searchQuery, selectedType, selectedPrivacy, selectedStatus, selectedProject]);

  // Handle Save (Create or Update)
  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;

    const tagsArray = formTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (editingId) {
      // Update
      const res = await updateMemoryApi(editingId, {
        type: formType,
        title: formTitle,
        content: formContent,
        projectId: formProjectId || undefined,
        tags: tagsArray,
        importance: formImportance,
        privacy: formPrivacy,
        approvalStatus: formStatus,
      });

      if (res.success) {
        setIsEditing(false);
        setEditingId(null);
        loadData();
      }
    } else {
      // Create
      const res = await createMemoryApi({
        type: formType,
        title: formTitle,
        content: formContent,
        projectId: formProjectId || undefined,
        tags: tagsArray,
        importance: formImportance,
        privacy: formPrivacy,
        approvalStatus: formStatus,
      });

      if (res.success) {
        setIsEditing(false);
        loadData();
      }
    }
  };

  const handleEditClick = (mem: MemoryEntry) => {
    setEditingId(mem.id);
    setFormType(mem.type);
    setFormTitle(mem.title);
    setFormContent(mem.content);
    setFormProjectId(mem.projectId || "");
    setFormTags(mem.tags.join(", "));
    setFormImportance(mem.importance);
    setFormPrivacy(mem.privacy);
    setFormStatus(mem.approvalStatus);
    setFormWarning([]);
    setFormRedacted(false);
    setIsEditing(true);
  };

  const handleNewClick = () => {
    setEditingId(null);
    setFormType("user_preference");
    setFormTitle("");
    setFormContent("");
    setFormProjectId("shawezgpt-main");
    setFormTags("");
    setFormImportance(3);
    setFormPrivacy("public");
    setFormStatus("approved");
    setFormWarning([]);
    setFormRedacted(false);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this memory entry?")) {
      const ok = await deleteMemoryApi(id);
      if (ok) loadData();
    }
  };

  const handleApprove = async (id: string) => {
    const ok = await approveMemoryApi(id);
    if (ok) loadData();
  };

  const handleReject = async (id: string) => {
    const ok = await rejectMemoryApi(id);
    if (ok) loadData();
  };

  const handleRunSimulator = async () => {
    if (!simQuery.trim()) return;
    setIsSimulating(true);
    try {
      const res = await simulateContextRetrievalApi(simQuery, simProjectId, simMaxTokens);
      setSimAssembly(res);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await runMemoryTestsApi();
      setTestReport(res);
    } catch (err) {
      console.error("Test execution failed:", err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const testPrivacySanitizer = () => {
    // Run client-side demonstration test
    let sanitized = privacyTestInput;
    const details: string[] = [];
    let redacted = false;

    if (/AIza[0-9A-Za-z_-]{30,45}/g.test(sanitized)) {
      sanitized = sanitized.replace(/AIza[0-9A-Za-z_-]{30,45}/g, "[REDACTED_API_KEY]");
      details.push("Detected & Redacted Google API Key");
      redacted = true;
    }
    if (/sk-[a-zA-Z0-9_-]{20,}/g.test(sanitized)) {
      sanitized = sanitized.replace(/sk-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_API_KEY]");
      details.push("Detected & Redacted OpenAI Secret Key");
      redacted = true;
    }
    if (/(?:password|passwd|pwd)\s*[:=]\s*["']([^"'\s]{4,})["']/gi.test(sanitized)) {
      sanitized = sanitized.replace(
        /(?:password|passwd|pwd)\s*[:=]\s*["']([^"'\s]{4,})["']/gi,
        'password: "[REDACTED_PASSWORD]"'
      );
      details.push("Detected & Redacted Password Assignment");
      redacted = true;
    }

    setPrivacyTestResult({
      sanitized,
      redacted,
      details: details.length > 0 ? details : ["No sensitive credentials detected (Clean)."],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Memory & Context Engine
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Zero-Credential Privacy
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Short-term, long-term, project-specific context, architectural decisions & relevance retrieval
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewClick}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Memory
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        {stats && (
          <div className="px-6 py-2.5 bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-slate-500 dark:text-slate-400">Total Memories:</span>
                <span className="font-bold text-slate-900 dark:text-white">{stats.totalMemories}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-slate-500 dark:text-slate-400">Approved:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.approvedMemories}</span>
              </div>
              {stats.pendingMemories > 0 && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-slate-500 dark:text-slate-400">Pending Review:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{stats.pendingMemories}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-slate-500 dark:text-slate-400">Est. Context:</span>
                <span className="font-bold text-slate-900 dark:text-white">~{stats.totalEstimatedTokens} tokens</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Credential Redactions:</span>
              <span className="font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {stats.sanitizedCount} Cleaned
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("explorer")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "explorer"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Search className="w-4 h-4" />
            Memory Explorer & Search
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "simulator"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Context Retrieval & Budget Simulator
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "privacy"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Privacy & Credential Sanitizer
          </button>
          <button
            onClick={() => setActiveTab("tests")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "tests"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Play className="w-4 h-4" />
            Automated Test Suite
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/20">
          {/* TAB 1: MEMORY EXPLORER */}
          {activeTab === "explorer" && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="md:col-span-2 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search memories by keyword, title, tag, or content..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Memory Types</option>
                    {MEMORY_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedPrivacy}
                    onChange={(e) => setSelectedPrivacy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Privacy Scopes</option>
                    <option value="public">Public (Global)</option>
                    <option value="project_only">Project Only (Isolated)</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              {/* Memory List */}
              {isLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                  <p className="text-xs">Loading stored context memories...</p>
                </div>
              ) : memories.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Brain className="w-10 h-10 mx-auto mb-3 text-slate-400 opacity-60" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No memories found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No memories match your current search query or filter criteria. Click "Add Memory" to create one.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {memories.map((mem) => {
                    const typeInfo = MEMORY_TYPES.find((t) => t.id === mem.type) || {
                      label: mem.type,
                      color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
                    };

                    return (
                      <div
                        key={mem.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-sm hover:border-purple-500/40 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>

                              {mem.privacy === "project_only" && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                                  <FolderGit2 className="w-3 h-3" />
                                  {mem.projectId || "Project Isolated"}
                                </span>
                              )}

                              {mem.approvalStatus === "pending" && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Pending Approval
                                </span>
                              )}

                              <span className="text-xs text-slate-400">
                                ~{mem.tokenCountEstimate} tokens • Importance: {"★".repeat(mem.importance)}
                              </span>

                              {mem.relevanceScore !== undefined && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  Match Score: {mem.relevanceScore}% ({mem.matchReason})
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {mem.title}
                            </h3>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {mem.content}
                            </p>

                            {mem.tags && mem.tags.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                                <Tag className="w-3 h-3 text-slate-400" />
                                {mem.tags.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                            {mem.approvalStatus === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(mem.id)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  title="Approve Memory"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(mem.id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20"
                                  title="Reject Memory"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEditClick(mem)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Edit Memory"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(mem.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                              title="Delete Memory"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONTEXT RETRIEVAL SIMULATOR */}
          {activeTab === "simulator" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Simulate Dynamic Context Assembly & Token Budgeting
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Test how the master Task Orchestrator retrieves, ranks, isolates by project, and summarizes stored memories prior to planning execution.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      User Prompt / Task Goal
                    </label>
                    <textarea
                      value={simQuery}
                      onChange={(e) => setSimQuery(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-200"
                      placeholder="Type a task prompt to test context retrieval..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Active Project Context ID (Isolation Boundary)
                      </label>
                      <input
                        type="text"
                        value={simProjectId}
                        onChange={(e) => setSimProjectId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Max Token Budget Limit
                        </label>
                        <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                          {simMaxTokens} tokens
                        </span>
                      </div>
                      <input
                        type="range"
                        min="200"
                        max="3000"
                        step="100"
                        value={simMaxTokens}
                        onChange={(e) => setSimMaxTokens(Number(e.target.value))}
                        className="w-full accent-purple-600"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleRunSimulator}
                      disabled={isSimulating}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSimulating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      Run Context Assembly Simulation
                    </button>
                  </div>
                </div>
              </div>

              {simAssembly && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                      <span className="text-xs text-slate-400">Retrieved Memories</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {simAssembly.retrievedMemories.length} matched
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                      <span className="text-xs text-slate-400">Consumed Token Estimate</span>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        ~{simAssembly.totalTokensEstimate} / {simMaxTokens} tokens
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                      <span className="text-xs text-slate-400">Summarized / Compressed</span>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {simAssembly.summarizedCount} entries
                      </p>
                    </div>
                  </div>

                  {/* Assembled Context Preview */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Assembled LLM Prompt Context Payload
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold">
                        Ready for Orchestrator
                      </span>
                    </div>

                    <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                      {simAssembly.combinedContext || "No relevant memories met the matching threshold."}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRIVACY & CREDENTIAL SANITIZER */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Privacy & Credential Security Rules
                  </h3>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                  <p className="font-semibold">STRICT DIRECTIVE: Never store passwords, API keys, or credentials.</p>
                  <p>
                    ShawezGPT enforces automated pattern recognition to block, strip, and redact any API keys (OpenAI, Google, Anthropic), GitHub PATs, JWT tokens, private SSH keys, and config passwords before writing to memory.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Live Credential Sanitizer Tester
                  </label>
                  <textarea
                    value={privacyTestInput}
                    onChange={(e) => setPrivacyTestInput(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Paste sample config, tokens, or text to verify automatic redaction..."
                  />

                  <button
                    onClick={testPrivacySanitizer}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Test Sanitizer Execution
                  </button>
                </div>

                {privacyTestResult && (
                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Sanitizer Results:
                      </span>
                      {privacyTestResult.redacted ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Credentials Redacted & Masked
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Safe & Clean
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {privacyTestResult.details.map((d, i) => (
                        <div key={i} className="text-xs text-slate-500 flex items-center gap-1.5">
                          <ChevronRight className="w-3 h-3 text-emerald-500" />
                          {d}
                        </div>
                      ))}
                    </div>

                    <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                      {privacyTestResult.sanitized}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AUTOMATED TEST SUITE */}
          {activeTab === "tests" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-purple-500" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Production Memory & Context Engine Test Suite
                      </h3>
                      <p className="text-xs text-slate-500">
                        Automated verification for creation, retrieval, relevance, project isolation, deletion, and privacy enforcement.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRunTests}
                    disabled={isRunningTests}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    {isRunningTests ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    Run Memory Test Suite
                  </button>
                </div>

                {testReport && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-xs font-semibold text-slate-500">Status</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {testReport.failed === 0 ? (
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              All Tests Passed ({testReport.passed}/{testReport.totalTests})
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4" />
                              {testReport.failed} Failed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-500">Duration</span>
                        <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                          {testReport.durationMs}ms
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {testReport.results.map((r, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                            r.passed
                              ? "bg-emerald-500/5 border-emerald-500/20 text-slate-800 dark:text-slate-200"
                              : "bg-red-500/5 border-red-500/20 text-red-800 dark:text-red-200"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {r.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs font-bold">{r.testName}</p>
                              {r.error && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">{r.error}</p>
                              )}
                            </div>
                          </div>

                          <span className="text-[11px] font-mono text-slate-400 shrink-0">
                            {r.durationMs}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>ShawezGPT Zero-Credential Context Retrieval Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                {editingId ? "Edit Stored Memory" : "Create New Memory Entry"}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMemory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Memory Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as MemoryType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500"
                >
                  {MEMORY_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Title / Rule Identifier
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  placeholder="e.g. Strict TypeScript Guidelines or ADR-001"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Memory Content (Sanitizer Active)
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required
                  rows={4}
                  placeholder="Provide explicit instructions, preferences, decisions, or architectural facts..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Project Scope ID
                  </label>
                  <input
                    type="text"
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    placeholder="e.g. shawezgpt-main or leave empty"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Privacy Level
                  </label>
                  <select
                    value={formPrivacy}
                    onChange={(e) => setFormPrivacy(e.target.value as MemoryPrivacy)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="public">Public / Global</option>
                    <option value="project_only">Project Only (Isolated)</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="typescript, tailwind, formatting"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Importance (1 - 5)
                  </label>
                  <select
                    value={formImportance}
                    onChange={(e) => setFormImportance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value={5}>5 - Critical Mandatory Rule</option>
                    <option value={4}>4 - High Importance</option>
                    <option value={3}>3 - Medium Importance</option>
                    <option value={2}>2 - Low Importance</option>
                    <option value={1}>1 - Contextual Background</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm"
                >
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
