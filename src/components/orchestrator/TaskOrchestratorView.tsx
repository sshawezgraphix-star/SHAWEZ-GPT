import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  Download,
  Eye,
  FileDown,
  FileText,
  Layers,
  Layout,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  GeneratedArtifact,
  OrchestrationPlan,
  OrchestratorPhase,
  OrchestratorSubtask,
} from "../../types";
import { CapabilityBadge } from "./CapabilityBadge";

interface TaskOrchestratorViewProps {
  plan: OrchestrationPlan;
  onPreviewArtifact?: (artifact: GeneratedArtifact) => void;
  isStreaming?: boolean;
}

const PHASES: Array<{ id: OrchestratorPhase; label: string }> = [
  { id: "planning", label: "Planning" },
  { id: "researching", label: "Researching" },
  { id: "creating", label: "Creating" },
  { id: "verifying", label: "Verifying" },
  { id: "completed", label: "Completed" },
];

export const TaskOrchestratorView: React.FC<TaskOrchestratorViewProps> = ({
  plan,
  onPreviewArtifact,
  isStreaming = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSubtaskId, setExpandedSubtaskId] = useState<string | null>(null);

  // Helper to determine phase index for progress bar
  const getPhaseIndex = (phase: OrchestratorPhase) => {
    switch (phase) {
      case "planning":
        return 0;
      case "researching":
        return 1;
      case "creating":
        return 2;
      case "verifying":
        return 3;
      case "completed":
        return 4;
      default:
        return 0;
    }
  };

  const currentPhaseIdx = getPhaseIndex(plan.phase);
  const totalSubtasks = plan.subtasks.length;
  const completedSubtasks = plan.subtasks.filter((s) => s.status === "completed").length;

  const handleDownloadArtifact = (art: GeneratedArtifact, e: React.MouseEvent) => {
    e.stopPropagation();
    if (art.dataUrl) {
      const link = document.createElement("a");
      link.href = art.dataUrl;
      link.download = art.filename || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (art.textContent) {
      const blob = new Blob([art.textContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = art.filename || "deliverable.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      className="my-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-slate-800 dark:text-slate-200 select-none transition-all"
      id={`orchestrator-plan-${plan.id}`}
    >
      {/* Top Banner: Orchestrator Header & Phase Tracker */}
      <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Task Orchestrator
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {plan.complexityScore.toUpperCase()} COMPLEXITY
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium line-clamp-1">
                {plan.detectedIntent}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {completedSubtasks}/{totalSubtasks} steps
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title={isExpanded ? "Collapse task details" : "Expand task details"}
              id={`toggle-plan-${plan.id}`}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 5-Phase Simple Progress Indicator: Planning → Researching → Creating → Verifying → Completed */}
        <div className="w-full pt-1 pb-1">
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 transition-all duration-500 z-0"
              style={{
                width: `${(currentPhaseIdx / (PHASES.length - 1)) * 100}%`,
              }}
            />

            {PHASES.map((phase, idx) => {
              const isPast = idx < currentPhaseIdx;
              const isCurrent = idx === currentPhaseIdx;
              const isFuture = idx > currentPhaseIdx;

              return (
                <div key={phase.id} className="relative z-10 flex flex-col items-center group">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-sm ${
                      isPast
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-500/20 animate-pulse"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isPast ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isCurrent && isStreaming ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1 whitespace-nowrap hidden sm:inline transition-colors ${
                      isCurrent
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isPast
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400"
                    }`}
                  >
                    {phase.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expandable Subtask List */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 space-y-2.5">
          {plan.subtasks.map((subtask, idx) => {
            const isSubtaskExpanded = expandedSubtaskId === subtask.id;

            return (
              <div
                key={subtask.id}
                className={`rounded-xl border transition-all ${
                  subtask.status === "running"
                    ? "border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30"
                    : subtask.status === "verifying"
                    ? "border-indigo-500/50 bg-indigo-50/20 dark:bg-indigo-950/20"
                    : subtask.status === "completed"
                    ? "border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50"
                    : subtask.status === "failed"
                    ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20"
                    : "border-slate-200/60 dark:border-slate-800/60 opacity-60"
                }`}
                id={`subtask-${subtask.id}`}
              >
                {/* Subtask Item Header */}
                <div
                  className="p-3 flex items-start justify-between gap-2.5 cursor-pointer"
                  onClick={() =>
                    setExpandedSubtaskId(isSubtaskExpanded ? null : subtask.id)
                  }
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {subtask.status === "completed" ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : subtask.status === "running" ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Loader2 className="w-3 h-3 animate-spin" />
                        </div>
                      ) : subtask.status === "verifying" ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <ShieldCheck className="w-3 h-3" />
                        </div>
                      ) : subtask.status === "failed" ? (
                        <div className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {idx + 1}. {subtask.title}
                        </span>
                        <CapabilityBadge capability={subtask.capability} size="sm" />

                        {/* Assigned Registered Agent Badge */}
                        {subtask.assignedAgentName && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {subtask.assignedAgentName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {subtask.description}
                      </p>

                      {/* Selected Registered Tools list */}
                      {subtask.selectedTools && subtask.selectedTools.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                            Tools:
                          </span>
                          {subtask.selectedTools.map((t) => (
                            <span
                              key={t}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {subtask.durationMs && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {(subtask.durationMs / 1000).toFixed(1)}s
                      </span>
                    )}
                    <span className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {isSubtaskExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Subtask Verification & Output Details */}
                {isSubtaskExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                    {/* Verification Result Banner */}
                    {subtask.verificationResult && (
                      <div
                        className={`p-2.5 rounded-lg flex items-start gap-2 ${
                          subtask.verificationResult.verified
                            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20"
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                        <div className="space-y-1">
                          <p className="font-semibold">{subtask.verificationResult.details}</p>
                          {subtask.verificationResult.checksPassed.length > 0 && (
                            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-slate-600 dark:text-slate-400">
                              {subtask.verificationResult.checksPassed.map((chk, i) => (
                                <li key={i}>{chk}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step Output Preview */}
                    {subtask.output && (
                      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 font-mono text-[11px] max-h-40 overflow-y-auto text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {subtask.output.slice(0, 800)}
                        {subtask.output.length > 800 && "..."}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Verified Artifacts / Generated Deliverables Card Bar */}
      {plan.artifacts && plan.artifacts.length > 0 && (
        <div className="p-3.5 sm:p-4 bg-slate-50/60 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Verified Deliverables & Files ({plan.artifacts.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {plan.artifacts.map((art) => (
              <div
                key={art.id}
                className="group p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm transition-all flex items-center justify-between gap-2"
                id={`artifact-card-${art.id}`}
              >
                <div
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                  onClick={() => onPreviewArtifact?.(art)}
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    {art.type === "pdf" ? (
                      <FileDown className="w-4 h-4" />
                    ) : art.type === "ui_preview" ? (
                      <Layout className="w-4 h-4" />
                    ) : (
                      <Code2 className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {art.filename || (art.type === "pdf" ? "report.pdf" : "deliverable")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onPreviewArtifact?.(art)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Preview Artifact"
                    id={`btn-preview-${art.id}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDownloadArtifact(art, e)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                    title="Download Verified File"
                    id={`btn-download-${art.id}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
