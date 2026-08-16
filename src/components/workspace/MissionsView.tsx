import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { GeneratedArtifact, MissionState, Project } from "../../types";
import { MissionDashboard } from "../orchestrator/MissionDashboard";

interface MissionsViewProps {
  project: Project;
  activeMission: MissionState | null;
  onSelectMission: (mission: MissionState) => void;
  onLaunchMission: (objective: string) => void;
  onMissionUpdate?: (updated: MissionState) => void;
  onPreviewArtifact?: (artifact: GeneratedArtifact) => void;
}

const MISSION_PRESETS = [
  {
    title: "Quantum & Neuromorphic Edge Benchmarks",
    objective:
      "Research the latest 2026 quantum co-processor and neuromorphic spike latency breakthroughs, synthesize an executive PDF report, and build an interactive telemetry HTML dashboard.",
  },
  {
    title: "Autonomous Web & SaaS Suite Synthesis",
    objective:
      "Design a production-ready multi-tenant SaaS workspace architecture with strict PostgreSQL row-level security, generate TypeScript schema code, and produce a verification report.",
  },
  {
    title: "Zero-Credential Security Audit & Privacy Verification",
    objective:
      "Audit project memory stores and code files for high-entropy tokens or API keys, execute 10-point privacy verification checks, and output a signed security audit certificate.",
  },
];

export const MissionsView: React.FC<MissionsViewProps> = ({
  project,
  activeMission,
  onSelectMission,
  onLaunchMission,
  onMissionUpdate,
  onPreviewArtifact,
}) => {
  const [objectiveInput, setObjectiveInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const projectMissions = project.missions || [];

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objectiveInput.trim()) return;
    onLaunchMission(objectiveInput.trim());
    setObjectiveInput("");
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8" id="missions-view">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Mission Control Center</h1>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Workspace: {project.name}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Give high-level autonomous objectives. ShawezGPT builds dependency DAGs, executes parallel stages, verifies outputs, and delivers final artifacts.
            </p>
          </div>
        </div>

        {/* If Active Mission is selected or running, display Dashboard */}
        {activeMission ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onSelectMission(null as any)}
                className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
              >
                ← Back to Mission Launcher & History
              </button>
            </div>
            <MissionDashboard
              mission={activeMission}
              onMissionUpdate={onMissionUpdate}
              onPreviewArtifact={onPreviewArtifact}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mission Launcher Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base">Launch Autonomous Objective</h3>
              </div>

              <form onSubmit={handleLaunch} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your high-level objective (e.g. Research quantum neuromorphic edge benchmarks, write an executive PDF report, and build an interactive dashboard)..."
                  value={objectiveInput}
                  onChange={(e) => setObjectiveInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 leading-relaxed placeholder:text-slate-500"
                  id="input-mission-objective"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-400">
                    Will auto-select required agents, verify DAG outputs, and produce PDF / HTML artifacts.
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    id="btn-launch-mission"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Initialize Mission</span>
                  </button>
                </div>
              </form>

              {/* Preset Objectives */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Quick-Launch Presets
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {MISSION_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setObjectiveInput(preset.objective);
                      }}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-left transition-colors flex flex-col justify-between group"
                    >
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-emerald-400 transition-colors">
                        {preset.title}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {preset.objective}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mission History for Current Project */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Mission History ({projectMissions.length})
              </h3>

              {projectMissions.length > 0 ? (
                <div className="space-y-3">
                  {projectMissions.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => onSelectMission(m)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 cursor-pointer transition-all group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              m.phase === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : m.phase === "failed"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse"
                            }`}
                          >
                            {m.phase}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(m.startedAt || m.createdAt || Date.now()).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {m.objective}
                        </h4>
                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span>{m.tasks?.length || 0} Subtasks</span>
                          <span>•</span>
                          <span>{m.artifacts?.length || 0} Artifacts</span>
                          <span>•</span>
                          <span>Progress: {m.overallProgress ?? m.progress ?? 0}%</span>
                        </div>
                      </div>

                      <button className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white text-xs font-semibold transition-colors shrink-0">
                        Open Dashboard →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-xs text-slate-400">
                  No active or past missions recorded in this workspace. Launch a mission above to begin.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
