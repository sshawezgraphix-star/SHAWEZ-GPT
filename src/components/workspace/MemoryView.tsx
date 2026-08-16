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
  Project,
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

interface MemoryViewProps {
  project: Project;
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

export const MemoryView: React.FC<MemoryViewProps> = ({ project }) => {
  const [activeTab, setActiveTab] = useState<"explorer" | "simulator" | "privacy" | "tests">("explorer");
  const [memories, setMemories] = useState<Array<MemoryEntry & { relevanceScore?: number; matchReason?: string }>>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isProjectOnly, setIsProjectOnly] = useState(true);

  // New Memory Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<MemoryType>("project_specific");
  const [newPrivacy, setNewPrivacy] = useState<MemoryPrivacy>("project_only");
  const [newImportance, setNewImportance] = useState(3);
  const [newTags, setNewTags] = useState("");

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImportance, setEditImportance] = useState(3);
  const [editPrivacy, setEditPrivacy] = useState<MemoryPrivacy>("project_only");

  // Simulator State
  const [simPrompt, setSimPrompt] = useState("What architectural decisions have we made for the project?");
  const [simTokens, setSimTokens] = useState(1200);
  const [simAssembly, setSimAssembly] = useState<ContextAssembly | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Test Runner State
  const [testReport, setTestReport] = useState<MemoryTestReport | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedMemories, fetchedStatsData] = await Promise.all([
        fetchMemoriesApi(isProjectOnly ? { projectId: project.id } : {}),
        fetchMemoryStatsApi(),
      ]);
      setMemories(fetchedMemories);
      setStats(fetchedStatsData?.stats || null);
    } catch (e) {
      console.error("Failed to load memory data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [project.id, isProjectOnly]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    try {
      const tagsArray = newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await createMemoryApi({
        title: newContent.trim().slice(0, 50),
        type: newType,
        content: newContent.trim(),
        privacy: newPrivacy,
        importance: newImportance,
        tags: tagsArray,
        projectId: newPrivacy === "project_only" ? project.id : undefined,
      });
      setIsCreateOpen(false);
      setNewContent("");
      setNewTags("");
      loadData();
    } catch (err) {
      console.error("Create memory error:", err);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await updateMemoryApi(id, {
        content: editContent,
        importance: editImportance,
        privacy: editPrivacy,
      });
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error("Update memory error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently delete this memory record?")) {
      try {
        await deleteMemoryApi(id);
        loadData();
      } catch (err) {
        console.error("Delete memory error:", err);
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMemoryApi(id);
      loadData();
    } catch (err) {
      console.error("Approve memory error:", err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMemoryApi(id);
      loadData();
    } catch (err) {
      console.error("Reject memory error:", err);
    }
  };

  const handleRunSimulation = async () => {
    if (!simPrompt.trim()) return;
    setIsSimulating(true);
    try {
      const result = await simulateContextRetrievalApi(
        simPrompt,
        isProjectOnly ? project.id : "shawezgpt-main",
        simTokens
      );
      setSimAssembly(result);
    } catch (e) {
      console.error("Sim error:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const report = await runMemoryTestsApi();
      setTestReport(report);
    } catch (e) {
      console.error("Tests error:", e);
    } finally {
      setIsRunningTests(false);
    }
  };

  const filteredMemories = memories.filter((m) => {
    const matchesSearch =
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === "all" || m.type === selectedType;
    const matchesPrivacy = selectedPrivacy === "all" || m.privacy === selectedPrivacy;
    const matchesStatus = selectedStatus === "all" || m.approvalStatus === selectedStatus;
    return matchesSearch && matchesType && matchesPrivacy && matchesStatus;
  });

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8" id="memory-view">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Memory & Context Console</h1>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {isProjectOnly ? `Active Workspace: ${project.name}` : "All Project Scopes"}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Hierarchical memory engine storing user preferences, decision records, stack rules, and project context with zero-credential privacy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsProjectOnly(!isProjectOnly)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                isProjectOnly
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}
            >
              {isProjectOnly ? "Project Scope: Isolated" : "Project Scope: Global"}
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              id="btn-add-memory"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-medium">Total Entries</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalMemories}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-medium">Pending Approvals</span>
              <div className="text-xl font-bold text-amber-500 mt-1">{stats.pendingMemories ?? 0}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-medium">Context Budget</span>
              <div className="text-xl font-bold text-emerald-500 mt-1">{stats.totalEstimatedTokens ?? 0} Tokens</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-medium">Privacy Status</span>
              <div className="text-xl font-bold text-indigo-400 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Sanitized</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("explorer")}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "explorer" ? "bg-purple-600 text-white font-semibold shadow-xs" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Memory Records ({memories.length})
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "simulator" ? "bg-purple-600 text-white font-semibold shadow-xs" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Context Assembly Simulator
          </button>
          <button
            onClick={() => setActiveTab("tests")}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "tests" ? "bg-purple-600 text-white font-semibold shadow-xs" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Security & Isolation Suite
          </button>
        </div>

        {/* Explorer Tab */}
        {activeTab === "explorer" && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search memories by text or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                >
                  <option value="all">All Types</option>
                  {MEMORY_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Memories List */}
            <div className="space-y-3">
              {filteredMemories.map((m) => (
                <div
                  key={m.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3"
                  id={`memory-item-${m.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 capitalize">
                        {m.type.replace(/_/g, " ")}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400">
                        {m.privacy}
                      </span>
                      <span className="text-[11px] text-amber-400">{"★".repeat(m.importance)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {m.approvalStatus === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(m.id)}
                            className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                            title="Approve Memory"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(m.id)}
                            className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                            title="Reject Memory"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    {m.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex flex-wrap gap-1">
                      {m.tags.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px]">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simulator Tab */}
        {activeTab === "simulator" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-base">Simulate Dynamic Context Assembly</h3>
            <p className="text-xs text-slate-400">
              Test how memories and decision records are retrieved, scored, and packaged into prompt context for this project.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={simPrompt}
                onChange={(e) => setSimPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
              />
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl"
              >
                {isSimulating ? "Assembling Context..." : "Simulate Retrieval"}
              </button>
            </div>

            {simAssembly && (
              <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-emerald-400">Assembly Status: {simAssembly.totalTokensEstimate} Tokens Used / {simTokens} Budget</div>
                <pre className="text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {simAssembly.combinedContext}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === "tests" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Run Memory Security & Boundary Suite</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verifies zero-credential leak prevention, project isolation barriers, and context budget limits.
                </p>
              </div>
              <button
                onClick={handleRunTests}
                disabled={isRunningTests}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
              >
                {isRunningTests ? "Running Suite..." : "Execute 10-Check Audit"}
              </button>
            </div>

            {testReport && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-emerald-400">
                  Result: {testReport.passed}/{testReport.totalTests} Checks Passed ({Math.round((testReport.passed / Math.max(1, testReport.totalTests)) * 100)}%)
                </div>
                <div className="space-y-1.5">
                  {testReport.results.map((r, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-300">{r.testName}</span>
                      <span className={r.passed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        {r.passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Memory Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base">Add New Memory Record</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Content *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Always use TypeScript strict mode with explicit return types."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as MemoryType)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                  >
                    {MEMORY_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Privacy Scope</label>
                  <select
                    value={newPrivacy}
                    onChange={(e) => setNewPrivacy(e.target.value as MemoryPrivacy)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                  >
                    <option value="project_only">Project Only ({project.name})</option>
                    <option value="private">Private to User</option>
                    <option value="public">Global Workspace</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="typescript, architecture, standards"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl"
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
};
