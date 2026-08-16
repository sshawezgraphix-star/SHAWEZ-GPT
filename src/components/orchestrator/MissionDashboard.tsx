import React, { useState } from "react";
import {
  ApprovalGateRequest,
  GeneratedArtifact,
  MissionControlActionRequest,
  MissionPhase,
  MissionState,
  MissionTask,
  MissionTestReport,
} from "../../types";
import {
  sendMissionControlAction,
  runMissionTestsApi,
} from "../../services/api";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileCode2,
  FileText,
  Flame,
  Layers,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  StopCircle,
  Terminal,
  UserCheck,
  Zap,
} from "lucide-react";
import { CapabilityBadge } from "./CapabilityBadge";
import { MarkdownRenderer } from "../MarkdownRenderer";

interface MissionDashboardProps {
  mission: MissionState;
  onMissionUpdate?: (updated: MissionState) => void;
  onPreviewArtifact?: (artifact: GeneratedArtifact) => void;
}

export const MissionDashboard: React.FC<MissionDashboardProps> = ({
  mission,
  onMissionUpdate,
  onPreviewArtifact,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isControlling, setIsControlling] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testReport, setTestReport] = useState<MissionTestReport | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const selectedTask = mission.tasks.find((t) => t.id === selectedTaskId) || mission.tasks[0];

  const handleControl = async (
    action: "pause" | "resume" | "cancel" | "retry" | "approve" | "reject",
    extra: { taskId?: string; approvalId?: string; decisionReason?: string } = {}
  ) => {
    setIsControlling(true);
    try {
      const res = await sendMissionControlAction(mission.id, action, extra);
      if (res.success && res.mission && onMissionUpdate) {
        onMissionUpdate(res.mission);
      }
    } finally {
      setIsControlling(false);
    }
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    setIsTestModalOpen(true);
    try {
      const report = await runMissionTestsApi();
      setTestReport(report);
    } finally {
      setIsRunningTests(false);
    }
  };

  const pendingApprovals = mission.pendingApprovals || [];
  const completedTasks = mission.tasks.filter((t) => t.status === "completed");
  const failedTasks = mission.tasks.filter((t) => t.status === "failed");
  const retriedTasks = mission.tasks.filter((t) => (t.retryCount || 0) > 0);

  // Phase badge color mapping
  const getPhaseBadge = (phase: MissionPhase) => {
    switch (phase) {
      case "planning":
        return { label: "Planning DAG", bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" };
      case "executing":
        return { label: "Executing Wave", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
      case "approval_gate":
        return { label: "Awaiting Operator Approval", bg: "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse" };
      case "paused":
        return { label: "Paused by Operator", bg: "bg-slate-500/20 text-slate-300 border-slate-500/30" };
      case "synthesizing":
        return { label: "Synthesizing Deliverables", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      case "completed":
        return { label: "Mission Accomplished", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      case "failed":
        return { label: "Mission Failed", bg: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
      case "cancelled":
        return { label: "Mission Cancelled", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
      default:
        return { label: phase, bg: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
    }
  };

  const phaseBadge = getPhaseBadge(mission.phase);

  return (
    <div className="w-full my-4 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md transition-all">
      {/* 1. Header & Controls Bar */}
      <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Mission Mode
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${phaseBadge.bg}`}>
                {phaseBadge.label}
              </span>
              {mission.controlState === "paused" && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Paused
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-slate-100 line-clamp-1 mt-0.5">
              {mission.objective}
            </h2>
          </div>
        </div>

        {/* Action Controls: Pause / Resume / Cancel / Test Suite */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {mission.controlState === "running" && (
            <button
              id="mission-pause-btn"
              onClick={() => handleControl("pause")}
              disabled={isControlling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Pause mission execution"
            >
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              Pause
            </button>
          )}

          {mission.controlState === "paused" && (
            <button
              id="mission-resume-btn"
              onClick={() => handleControl("resume")}
              disabled={isControlling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition"
              title="Resume mission execution"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              Resume
            </button>
          )}

          {(mission.phase === "executing" || mission.phase === "planning" || mission.phase === "approval_gate") && (
            <button
              id="mission-cancel-btn"
              onClick={() => handleControl("cancel")}
              disabled={isControlling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition"
              title="Cancel mission execution"
            >
              <StopCircle className="w-3.5 h-3.5 text-rose-400" />
              Cancel
            </button>
          )}

          {mission.phase === "failed" && (
            <button
              id="mission-retry-btn"
              onClick={() => {
                const firstFailed = mission.tasks.find((t) => t.status === "failed");
                if (firstFailed) handleControl("retry", { taskId: firstFailed.id });
              }}
              disabled={isControlling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow transition"
              title="Retry failed task"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry Task
            </button>
          )}

          <button
            id="mission-run-tests-btn"
            onClick={handleRunTests}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/20 transition"
            title="Run 8-stage automated test suite"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Automated Tests
          </button>
        </div>
      </div>

      {/* 2. Irreversible Action Approval Gate Alert (CRITICAL) */}
      {pendingApprovals.length > 0 && (
        <div className="px-5 py-3.5 bg-amber-500/10 border-b border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
                Approval Required Before Irreversible Action
                <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  {pendingApprovals[0].dangerLevel} Risk
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {pendingApprovals[0].description} ({pendingApprovals[0].impactDescription})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              id={`approve-btn-${pendingApprovals[0].id}`}
              onClick={() =>
                handleControl("approve", {
                  approvalId: pendingApprovals[0].id,
                  decisionReason: approvalReason || "Operator approved in UI",
                })
              }
              disabled={isControlling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve Action
            </button>
            <button
              id={`reject-btn-${pendingApprovals[0].id}`}
              onClick={() =>
                handleControl("reject", {
                  approvalId: pendingApprovals[0].id,
                  decisionReason: approvalReason || "Operator rejected irreversible action",
                })
              }
              disabled={isControlling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Reject / Skip
            </button>
          </div>
        </div>
      )}

      {/* 3. Telemetry & Metrics Row */}
      <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Progress Bar */}
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-medium">
            <span>Overall Progress</span>
            <span className="text-cyan-400 font-bold">{mission.overallProgress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${mission.overallProgress}%` }}
            />
          </div>
        </div>

        {/* Active Agents Badge */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Active Agent:</span>
          {mission.activeAgentNames && mission.activeAgentNames.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {mission.activeAgentNames.map((name, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 text-[11px] italic">Idle / Succeeded</span>
          )}
        </div>

        {/* Task Counters */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {completedTasks.length}/{mission.tasks.length} Done
          </span>
          {retriedTasks.length > 0 && (
            <span className="text-amber-400 flex items-center gap-1 font-medium">
              <RotateCcw className="w-3.5 h-3.5" />
              {retriedTasks.length} Recovered
            </span>
          )}
          {failedTasks.length > 0 && (
            <span className="text-rose-400 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {failedTasks.length} Failed
            </span>
          )}
          {mission.artifacts.length > 0 && (
            <span className="text-cyan-400 flex items-center gap-1 font-medium">
              <FileCode2 className="w-3.5 h-3.5" />
              {mission.artifacts.length} Artifacts
            </span>
          )}
        </div>
      </div>

      {/* 4. DAG Pipeline Waves & Task Cards */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: DAG Stages and Subtasks list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Dependency Execution Plan ({mission.dag.stages.length} Stages)
            </h3>
            <span className="text-[11px] text-slate-500">
              {mission.dag.stages.filter((s) => s.isParallel).length} Parallel Waves
            </span>
          </div>

          <div className="space-y-3">
            {mission.dag.stages.map((stage) => {
              const stageTasks = mission.tasks.filter((t) => stage.taskIds.includes(t.id));
              return (
                <div
                  key={stage.stageIndex}
                  className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-cyan-400">
                        {stage.stageIndex + 1}
                      </span>
                      {stage.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/70 text-slate-400">
                      {stage.isParallel ? "Parallel Wave" : "Sequential"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {stageTasks.map((task) => {
                      const isSelected = selectedTask.id === task.id;
                      return (
                        <div
                          key={task.id}
                          id={`task-card-${task.id}`}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                            isSelected
                              ? "bg-slate-800/90 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/20"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                              {task.title}
                            </h4>
                            <StatusBadge status={task.status} />
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                            {task.description}
                          </p>

                          <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="text-slate-400 font-medium">
                              {task.fallbackAgentName ? (
                                <span className="text-amber-300 font-semibold flex items-center gap-1">
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  {task.fallbackAgentName}
                                </span>
                              ) : (
                                task.assignedAgentName
                              )}
                            </span>
                            {task.durationMs !== undefined && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {task.durationMs}ms
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Task Detail, Verification, & Artifacts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-400" />
              Task Inspector & Verification
            </h3>
          </div>

          {selectedTask ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Task Details
                  </span>
                  <StatusBadge status={selectedTask.status} />
                </div>
                <h4 className="text-sm font-semibold text-slate-100 mt-1">
                  {selectedTask.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedTask.description}
                </p>
              </div>

              {/* Agent & Capability */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Assigned Agent</span>
                  <span className="font-semibold text-slate-200">{selectedTask.assignedAgentName}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Capability</span>
                  <span className="font-semibold text-cyan-400 capitalize">{selectedTask.capability}</span>
                </div>
              </div>

              {/* Verification Results */}
              {selectedTask.verificationResult && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Verification Conformance
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                      PASSED
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {selectedTask.verificationResult.checksPassed.map((chk, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{chk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Task Output / Artifact Preview */}
              {selectedTask.output && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                    Execution Output
                  </span>
                  <div className="max-h-48 overflow-y-auto p-2.5 rounded bg-slate-900 text-slate-300 text-xs font-mono border border-slate-800/80 whitespace-pre-wrap">
                    {selectedTask.output}
                  </div>
                </div>
              )}

              {/* Task Specific Artifacts */}
              {selectedTask.artifacts && selectedTask.artifacts.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                    Generated Deliverables
                  </span>
                  <div className="space-y-1.5">
                    {selectedTask.artifacts.map((art) => (
                      <button
                        key={art.id}
                        onClick={() => onPreviewArtifact?.(art)}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition"
                      >
                        <div className="flex items-center gap-2">
                          <FileCode2 className="w-4 h-4 text-cyan-400" />
                          <div>
                            <span className="text-xs font-medium text-slate-200 block">{art.title}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{art.type}</span>
                          </div>
                        </div>
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select a task to inspect execution telemetry and schema checks.
            </div>
          )}
        </div>
      </div>

      {/* 5. Final Synthesis & Deliverables Section (When Synthesizing or Completed) */}
      {mission.finalSynthesis && (
        <div className="border-t border-slate-800 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Final Executive Synthesis & Deliverables
            </h3>
            {mission.verificationOverall && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Score: {mission.verificationOverall.score}/100
              </span>
            )}
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm">
            <MarkdownRenderer content={mission.finalSynthesis} />
          </div>
        </div>
      )}

      {/* 6. Automated Test Suite Runner Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Mission Mode 8-Stage Automated Test Suite
                </h3>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            {isRunningTests ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-sm font-semibold text-slate-300">
                  Executing 8-Stage Mission Mode Validation Suite...
                </p>
                <p className="text-xs text-slate-500">
                  Testing planning, dependencies, parallel execution, failure recovery, approval gates & artifact delivery.
                </p>
              </div>
            ) : testReport ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                  <span className="font-semibold text-slate-300">
                    Results: {testReport.passed}/{testReport.totalTests} Passed ({testReport.durationMs}ms)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      testReport.failed === 0
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {testReport.failed === 0 ? "100% GREEN & VERIFIED" : `${testReport.failed} FAILED`}
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {testReport.results.map((r, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded bg-slate-950/80 border border-slate-800 flex items-start justify-between text-xs"
                    >
                      <div className="flex items-start gap-2">
                        {r.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-medium text-slate-200">{r.testName}</span>
                          {r.error && <p className="text-rose-400 text-[11px] mt-0.5">{r.error}</p>}
                        </div>
                      </div>
                      <span className="text-slate-500 font-mono text-[10px] shrink-0">
                        {r.durationMs}ms
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleRunTests}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Re-run Test Suite
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

function StatusBadge({ status }: { status: MissionTask["status"] }) {
  switch (status) {
    case "completed":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Done
        </span>
      );
    case "running":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
          Running
        </span>
      );
    case "verifying":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          Verifying
        </span>
      );
    case "awaiting_approval":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Approval Gate
        </span>
      );
    case "retrying":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Retrying
        </span>
      );
    case "failed":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Failed
        </span>
      );
    case "skipped":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          Skipped
        </span>
      );
    case "cancelled":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
          Pending
        </span>
      );
  }
}
