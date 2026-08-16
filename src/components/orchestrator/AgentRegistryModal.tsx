import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  FileCode,
  FileText,
  Key,
  Layers,
  Play,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  X,
} from "lucide-react";
import {
  AgentRegistryItem,
  RegistryHealthReport,
  RegistryTestReport,
  ToolRegistryItem,
} from "../../types";
import {
  fetchRegisteredAgents,
  fetchRegisteredTools,
  fetchRegistryHealth,
  runRegistryTestsApi,
  updateAgentStatusApi,
} from "../../services/api";
import { CapabilityBadge } from "./CapabilityBadge";

interface AgentRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentRegistryModal: React.FC<AgentRegistryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"agents" | "tools" | "health" | "tests">("agents");
  const [agents, setAgents] = useState<AgentRegistryItem[]>([]);
  const [tools, setTools] = useState<ToolRegistryItem[]>([]);
  const [healthReport, setHealthReport] = useState<RegistryHealthReport | null>(null);
  const [testReport, setTestReport] = useState<RegistryTestReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agentsData, toolsData, healthData] = await Promise.all([
        fetchRegisteredAgents(),
        fetchRegisteredTools(),
        fetchRegistryHealth(),
      ]);
      setAgents(agentsData);
      setTools(toolsData);
      setHealthReport(healthData);
      if (agentsData.length > 0 && !selectedAgentId) {
        setSelectedAgentId(agentsData[0].id);
      }
      if (toolsData.length > 0 && !selectedToolId) {
        setSelectedToolId(toolsData[0].id);
      }
    } catch (err) {
      console.error("Failed to load registry data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const report = await runRegistryTestsApi();
      setTestReport(report);
      setActiveTab("tests");
    } catch (err) {
      console.error("Error executing tests:", err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleStatusChange = async (
    agentId: string,
    newStatus: "active" | "degraded" | "inactive" | "maintenance"
  ) => {
    setStatusUpdating(agentId);
    try {
      const success = await updateAgentStatusApi(agentId, newStatus);
      if (success) {
        setAgents((prev) =>
          prev.map((a) => (a.id === agentId ? { ...a, status: newStatus } : a))
        );
      }
    } finally {
      setStatusUpdating(null);
    }
  };

  if (!isOpen) return null;

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.capabilities.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const selectedTool = tools.find((t) => t.id === selectedToolId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-200"
        id="agent-tool-registry-modal"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Agent & Tool Registry
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                  Production Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dynamic discovery, tool binding, schema enforcement, and health monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              id="btn-run-registry-tests"
            >
              {isRunningTests ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isRunningTests ? "Testing..." : "Run Test Suite"}</span>
            </button>

            <button
              onClick={loadData}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Registry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              id="btn-close-registry-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Search */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-slate-100/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab("agents")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "agents"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              id="tab-agents"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Agents ({agents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("tools")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "tools"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              id="tab-tools"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Tools ({tools.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("health")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "health"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              id="tab-health"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>System Health</span>
              {healthReport && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    healthReport.status === "healthy"
                      ? "bg-emerald-500"
                      : healthReport.status === "degraded"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab("tests")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "tests"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              id="tab-tests"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tests {testReport ? `(${testReport.passed}/${testReport.totalTests})` : ""}</span>
            </button>
          </div>

          {(activeTab === "agents" || activeTab === "tools") && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === "agents" ? "Search agents..." : "Search tools..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-hidden">
          {/* 1. AGENTS TAB */}
          {activeTab === "agents" && (
            <div className="grid grid-cols-1 md:grid-cols-12 h-full">
              {/* Agent List Column */}
              <div className="md:col-span-5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-3 space-y-2">
                {filteredAgents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedAgentId === agent.id
                        ? "bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold">{agent.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">v{agent.version}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          agent.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : agent.status === "degraded"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {agent.purpose}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {agent.capabilities.map((c) => (
                        <CapabilityBadge key={c} capability={c} size="sm" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Agent Detail Column */}
              <div className="md:col-span-7 overflow-y-auto p-4 sm:p-5 space-y-4">
                {selectedAgent ? (
                  <div className="space-y-4">
                    {/* Header Details */}
                    <div className="flex flex-wrap items-start justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {selectedAgent.name}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({selectedAgent.id})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {selectedAgent.purpose}
                        </p>
                      </div>

                      {/* Status Toggle Dropdown */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-500">Status:</label>
                        <select
                          value={selectedAgent.status}
                          disabled={statusUpdating === selectedAgent.id}
                          onChange={(e) =>
                            handleStatusChange(
                              selectedAgent.id,
                              e.target.value as any
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="active">Active</option>
                          <option value="degraded">Degraded</option>
                          <option value="inactive">Inactive</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                    </div>

                    {/* Capabilities & Permissions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                          <Layers className="w-3.5 h-3.5 text-emerald-500" />
                          Capabilities
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedAgent.capabilities.map((cap) => (
                            <CapabilityBadge key={cap} capability={cap} size="sm" />
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                          <Key className="w-3.5 h-3.5 text-amber-500" />
                          Permissions
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedAgent.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bound Registered Tools */}
                    <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                        <Wrench className="w-3.5 h-3.5 text-indigo-500" />
                        Bound Tools ({selectedAgent.tools.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAgent.tools.map((tid) => (
                          <span
                            key={tid}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1"
                          >
                            <Wrench className="w-3 h-3" />
                            {tid}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Telemetry Metrics */}
                    <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                        <Activity className="w-3.5 h-3.5 text-cyan-500" />
                        Execution Telemetry
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <p className="text-xs text-slate-400">Total Calls</p>
                          <p className="text-sm font-bold mt-0.5">{selectedAgent.metrics.totalInvocations}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <p className="text-xs text-slate-400">Success Rate</p>
                          <p className="text-sm font-bold text-emerald-500 mt-0.5">
                            {selectedAgent.metrics.totalInvocations > 0
                              ? Math.round(
                                  (selectedAgent.metrics.successfulInvocations /
                                    selectedAgent.metrics.totalInvocations) *
                                    100
                                )
                              : 100}
                            %
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <p className="text-xs text-slate-400">Failures</p>
                          <p className="text-sm font-bold text-rose-500 mt-0.5">
                            {selectedAgent.metrics.failedInvocations}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <p className="text-xs text-slate-400">Avg Latency</p>
                          <p className="text-sm font-bold font-mono mt-0.5">
                            {Math.round(selectedAgent.metrics.averageLatencyMs)}ms
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Schemas: Input & Output */}
                    <div className="space-y-2">
                      <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                          <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                          Input JSON Schema
                        </span>
                        <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
                          {JSON.stringify(selectedAgent.inputSchema, null, 2)}
                        </pre>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                          <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                          Output JSON Schema
                        </span>
                        <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
                          {JSON.stringify(selectedAgent.outputSchema, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    Select an agent to inspect details
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. TOOLS TAB */}
          {activeTab === "tools" && (
            <div className="grid grid-cols-1 md:grid-cols-12 h-full">
              {/* Tool List Column */}
              <div className="md:col-span-5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-3 space-y-2">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => setSelectedToolId(tool.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedToolId === tool.id
                        ? "bg-indigo-500/10 border-indigo-500 text-slate-900 dark:text-white shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold">{tool.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">v{tool.version}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          tool.status === "available"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {tool.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {tool.description}
                    </p>

                    <div className="flex items-center gap-1.5 mt-2.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                        {tool.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tool Detail Column */}
              <div className="md:col-span-7 overflow-y-auto p-4 sm:p-5 space-y-4">
                {selectedTool ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedTool.name}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({selectedTool.id})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {selectedTool.description}
                      </p>
                    </div>

                    {/* Permissions */}
                    <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                        <Key className="w-3.5 h-3.5 text-amber-500" />
                        Required Permissions
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTool.permissions.map((p) => (
                          <span
                            key={p}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Parameters JSONSchema */}
                    <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                        <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                        Parameters JSON Schema
                      </span>
                      <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
                        {JSON.stringify(selectedTool.parameters, null, 2)}
                      </pre>
                    </div>

                    {/* Returns JSONSchema */}
                    <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                        <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                        Returns JSON Schema
                      </span>
                      <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
                        {JSON.stringify(selectedTool.returns, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    Select a tool to inspect parameters and execution contracts
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. HEALTH TAB */}
          {activeTab === "health" && (
            <div className="p-5 overflow-y-auto h-full space-y-4">
              {healthReport ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          healthReport.status === "healthy"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider">
                          System Status: {healthReport.status}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Last Checked: {new Date(healthReport.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div className="text-right">
                        <p className="text-slate-400">Active Agents</p>
                        <p className="text-emerald-500 font-bold">
                          {healthReport.activeAgents} / {healthReport.totalAgents}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400">Available Tools</p>
                        <p className="text-indigo-500 font-bold">
                          {healthReport.availableTools} / {healthReport.totalTools}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Agent Health Grid */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Agent Health Verification
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Object.entries(healthReport.agentHealth).map(([aid, chk]) => (
                        <div
                          key={aid}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="text-xs font-bold">{aid}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {chk.details}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono text-slate-400">{chk.latencyMs}ms</span>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Healthy
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tool Health Grid */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Tool Endpoints & Capability Validation
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Object.entries(healthReport.toolHealth).map(([tid, chk]) => (
                        <div
                          key={tid}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="text-xs font-bold">{tid}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {chk.details}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono text-slate-400">{chk.latencyMs}ms</span>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Online
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-400 text-xs">
                  Loading system health report...
                </div>
              )}
            </div>
          )}

          {/* 4. TESTS TAB */}
          {activeTab === "tests" && (
            <div className="p-5 overflow-y-auto h-full space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Automated Registry & Routing Test Suite
                  </h3>
                  <p className="text-xs text-slate-500">
                    Validates Agent Discovery, Tool Selection, Task Routing, Capability Enforcement, and Failure Handling
                  </p>
                </div>
                <button
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunningTests ? "Running..." : "Execute Tests"}</span>
                </button>
              </div>

              {testReport ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-950 text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">
                      Summary: {testReport.passed}/{testReport.totalTests} tests passed
                    </span>
                    <span className="font-mono text-slate-400">Total duration: {testReport.durationMs}ms</span>
                  </div>

                  <div className="space-y-2">
                    {testReport.results.map((r, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                          r.passed
                            ? "bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-500/30 text-slate-900 dark:text-white"
                            : "bg-rose-50/20 dark:bg-rose-950/20 border-rose-500/30 text-rose-900 dark:text-rose-200"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {r.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold">{r.testName}</h5>
                            {r.error && (
                              <p className="text-xs text-rose-500 mt-1 font-mono">{r.error}</p>
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
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Terminal className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">Click "Execute Tests" to run the production test suite.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
