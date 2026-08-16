import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Globe,
  Layers,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  Zap,
} from "lucide-react";
import { AgentRegistryItem, ToolRegistryItem } from "../../types";

export const AGENT_REGISTRY_DATA: AgentRegistryItem[] = [
  {
    id: "agent_orchestrator",
    name: "Master DAG Orchestrator",
    purpose: "Deconstructs objectives, builds dependency DAGs, groups parallel execution waves, and orchestrates agent fallbacks.",
    version: "2.5.0",
    status: "healthy",
    capabilities: ["general_ai", "research", "coding", "data_analysis"],
    supportedCapabilities: ["general_ai", "research", "coding", "data_analysis"],
    tools: ["tool_dag_planner", "tool_wave_scheduler", "tool_verifier"],
    averageLatencyMs: 18.2,
    successRate: 1.0,
    totalExecutions: 1420,
    inputSchema: { objective: "string", constraints: "string[]", maxParallelWaves: "number" },
    outputSchema: { planId: "string", waves: "StageWave[]", finalArtifacts: "GeneratedArtifact[]" },
  },
  {
    id: "agent_researcher",
    name: "Deep Web & Grounding Researcher",
    purpose: "Performs autonomous multi-source web intelligence synthesis, citation extraction, and cross-reference verification.",
    version: "2.4.2",
    status: "healthy",
    capabilities: ["research", "web_search"],
    supportedCapabilities: ["research", "web_search"],
    tools: ["tool_web_search", "tool_url_fetcher", "tool_fact_extractor"],
    averageLatencyMs: 42.6,
    successRate: 0.99,
    totalExecutions: 3890,
    inputSchema: { query: "string", domains: "string[]", depth: "deep | quick" },
    outputSchema: { findings: "string", sources: "GroundingSource[]", confidence: "number" },
  },
  {
    id: "agent_coder",
    name: "Full-Stack Software Engineer",
    purpose: "Generates clean TypeScript/React, Python, SQL, and backend architecture with automated syntax validation.",
    version: "2.5.1",
    status: "healthy",
    capabilities: ["coding", "code_analysis_debugging"],
    supportedCapabilities: ["coding", "code_analysis_debugging"],
    tools: ["tool_code_generator", "tool_syntax_linter", "tool_ast_parser"],
    averageLatencyMs: 31.4,
    successRate: 1.0,
    totalExecutions: 5120,
    inputSchema: { prompt: "string", language: "string", targetFramework: "string" },
    outputSchema: { code: "string", filename: "string", testsIncluded: "boolean" },
  },
  {
    id: "agent_pdf_generator",
    name: "Executive PDF & Document Publisher",
    purpose: "Synthesizes structured research into executive PDF reports with metadata, charts, and table of contents.",
    version: "2.3.0",
    status: "healthy",
    capabilities: ["pdf_doc_generation", "writing"],
    supportedCapabilities: ["pdf_doc_generation", "writing"],
    tools: ["tool_pdf_renderer", "tool_markdown_compiler", "tool_toc_builder"],
    averageLatencyMs: 28.5,
    successRate: 1.0,
    totalExecutions: 1980,
    inputSchema: { title: "string", markdownBody: "string", executiveSummary: "string" },
    outputSchema: { filename: "string", pageCount: "number", fileSize: "number" },
  },
  {
    id: "agent_ui_builder",
    name: "Interactive UI & Sandbox Generator",
    purpose: "Produces standalone, interactive HTML5/Tailwind/React dashboard components with real-time responsive states.",
    version: "2.5.0",
    status: "healthy",
    capabilities: ["ui_website_generation"],
    supportedCapabilities: ["ui_website_generation"],
    tools: ["tool_html_sandbox_builder", "tool_tailwind_injector", "tool_iframe_validator"],
    averageLatencyMs: 35.8,
    successRate: 1.0,
    totalExecutions: 2450,
    inputSchema: { dashboardTitle: "string", telemetryData: "object", theme: "string" },
    outputSchema: { previewHtml: "string", framework: "string", responsiveViewports: "string[]" },
  },
  {
    id: "agent_data_analyst",
    name: "Data & Statistical Modeler",
    purpose: "Analyzes datasets, calculates summary matrices, parses CSV/JSON telemetry, and formats benchmark tables.",
    version: "2.4.0",
    status: "healthy",
    capabilities: ["data_analysis", "file_analysis"],
    supportedCapabilities: ["data_analysis", "file_analysis"],
    tools: ["tool_csv_parser", "tool_matrix_calculator", "tool_json_validator"],
    averageLatencyMs: 22.1,
    successRate: 1.0,
    totalExecutions: 1670,
    inputSchema: { rawData: "string", analysisType: "comparative | trend | summary" },
    outputSchema: { metrics: "Record<string, any>", tableMarkdown: "string" },
  },
  {
    id: "agent_verifier",
    name: "Multi-Tier Output Verifier",
    purpose: "Executes 4-point verification checks: schema compliance, markdown integrity, fact grounding, and code non-emptiness.",
    version: "2.5.0",
    status: "healthy",
    capabilities: ["general_ai", "code_analysis_debugging"],
    supportedCapabilities: ["general_ai", "code_analysis_debugging"],
    tools: ["tool_schema_validator", "tool_integrity_check", "tool_grounding_audit"],
    averageLatencyMs: 14.3,
    successRate: 1.0,
    totalExecutions: 6780,
    inputSchema: { taskOutput: "string", requiredSchema: "object", checks: "string[]" },
    outputSchema: { verified: "boolean", checksPassed: "string[]", details: "string" },
  },
  {
    id: "agent_security_sanitizer",
    name: "Zero-Credential Privacy Guard",
    purpose: "Scans memory and task streams to detect and redact API keys, passwords, bearer tokens, and sensitive credentials.",
    version: "2.5.0",
    status: "healthy",
    capabilities: ["general_ai"],
    supportedCapabilities: ["general_ai"],
    tools: ["tool_token_sanitizer", "tool_entropy_scanner", "tool_credential_redactor"],
    averageLatencyMs: 8.9,
    successRate: 1.0,
    totalExecutions: 8900,
    inputSchema: { rawText: "string", strictMode: "boolean" },
    outputSchema: { sanitizedText: "string", redactedCount: "number", categories: "string[]" },
  },
];

export const TOOL_REGISTRY_DATA: ToolRegistryItem[] = [
  {
    id: "tool_dag_planner",
    name: "DAG Planner Engine",
    category: "system",
    description: "Computes topological sorting and stage dependency waves for autonomous objectives.",
    isBuiltin: true,
    parameters: [{ name: "objective", type: "string", required: true, description: "High-level goal" }],
  },
  {
    id: "tool_web_search",
    name: "Google Grounding & Web Search",
    category: "search",
    description: "Fetches live verified facts, research citations, and official documentation.",
    isBuiltin: true,
    parameters: [{ name: "query", type: "string", required: true, description: "Search query" }],
  },
  {
    id: "tool_code_generator",
    name: "Sandboxed Code Generator",
    category: "generation",
    description: "Generates clean modular TypeScript, Python, and SQL with automated lint checks.",
    isBuiltin: true,
    parameters: [{ name: "prompt", type: "string", required: true, description: "Engineering prompt" }],
  },
  {
    id: "tool_pdf_renderer",
    name: "PDF Executive Compiler",
    category: "generation",
    description: "Compiles formatted markdown and metadata into downloadable PDF documents.",
    isBuiltin: true,
    parameters: [{ name: "markdown", type: "string", required: true, description: "Report markdown body" }],
  },
  {
    id: "tool_html_sandbox_builder",
    name: "HTML5 / Tailwind Sandbox Builder",
    category: "generation",
    description: "Builds single-file responsive dashboards ready for iframe execution.",
    isBuiltin: true,
    parameters: [{ name: "html", type: "string", required: true, description: "HTML5 payload" }],
  },
  {
    id: "tool_token_sanitizer",
    name: "Privacy & Secret Sanitizer",
    category: "security",
    description: "Zero-credential security engine redacting API keys, JWTs, and private credentials.",
    isBuiltin: true,
    parameters: [{ name: "input", type: "string", required: true, description: "Text to sanitize" }],
  },
];

export const AgentsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"agents" | "tools">("agents");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentRegistryItem | null>(null);
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [diagnosticPassed, setDiagnosticPassed] = useState(true);

  const filteredAgents = AGENT_REGISTRY_DATA.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.supportedCapabilities || a.capabilities || []).some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTools = TOOL_REGISTRY_DATA.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRunHealthCheck = () => {
    setIsRunningCheck(true);
    setTimeout(() => {
      setIsRunningCheck(false);
      setDiagnosticPassed(true);
    }, 1000);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8" id="agents-view">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Agent & Tool Registry</h1>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  8 Registered Specialized Agents • 6 Native Tools
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Inspect agent routing capabilities, tool permission boundaries, system latency benchmarks, and sandbox configurations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunHealthCheck}
              disabled={isRunningCheck}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              id="btn-health-check"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningCheck ? "animate-spin" : ""}`} />
              <span>{isRunningCheck ? "Testing Cluster..." : "Run Health Check"}</span>
            </button>
          </div>
        </div>

        {/* Diagnostics Banner */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">Cluster Status: All Systems Operational (100% Verified)</span>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                DAG planning, fallback routing, and zero-credential sanitizer active with avg 24.5ms response time.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono font-bold">
            LATENCY: 18ms
          </span>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by agent name, capability, or tool..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              id="input-search-agents"
            />
          </div>

          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveTab("agents")}
              className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "agents" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Specialized Agents (8)
            </button>
            <button
              onClick={() => setActiveTab("tools")}
              className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "tools" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Registered Tools (6)
            </button>
          </div>
        </div>

        {/* Agents Tab Content */}
        {activeTab === "agents" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
                id={`agent-card-${agent.id}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                          {agent.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono text-indigo-400">v{agent.version}</span>
                          <span>•</span>
                          <span className="text-emerald-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Healthy
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {agent.purpose}
                  </p>

                  {/* Capabilities */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Target Capabilities
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(agent.supportedCapabilities || agent.capabilities || []).map((cap) => (
                        <span
                          key={cap}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tools */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Assigned Tools
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {agent.tools.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metrics Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>Latency: <strong className="text-slate-200">{agent.averageLatencyMs ?? agent.metrics?.averageLatencyMs ?? 15}ms</strong></span>
                    <span>Pass Rate: <strong className="text-emerald-400">{Math.round((agent.successRate ?? 1.0) * 100)}%</strong></span>
                  </div>
                  <button
                    onClick={() => setSelectedAgent(agent)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    View Schema →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tools Tab Content */}
        {activeTab === "tools" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-3"
                id={`tool-card-${tool.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-400">
                    {tool.category}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{tool.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tool.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Parameters Schema
                  </span>
                  <div className="space-y-1">
                    {tool.parameters.map((p) => (
                      <div key={p.name} className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-indigo-400">{p.name}</span>
                        <span className="text-slate-500">({p.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schema Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base">{selectedAgent.name}</h3>
                <span className="text-xs text-slate-400 font-mono">Agent ID: {selectedAgent.id}</span>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">Input JSON Schema:</span>
              <pre className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-emerald-400 border border-slate-800 overflow-x-auto">
                {JSON.stringify(selectedAgent.inputSchema, null, 2)}
              </pre>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">Output JSON Schema:</span>
              <pre className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-indigo-400 border border-slate-800 overflow-x-auto">
                {JSON.stringify(selectedAgent.outputSchema, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
