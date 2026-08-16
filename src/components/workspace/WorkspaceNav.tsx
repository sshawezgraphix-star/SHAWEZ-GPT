import React from "react";
import {
  Archive,
  Bot,
  Brain,
  Cpu,
  FileCode2,
  FolderKanban,
  HardDrive,
  Layers,
  MessageSquare,
  Package,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { Project, WorkspaceView } from "../../types";

interface WorkspaceNavProps {
  currentView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  activeProject: Project;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onOpenNewProject: () => void;
  activeMissionsCount?: number;
  filesCount?: number;
  artifactsCount?: number;
  memoriesCount?: number;
}

export const WorkspaceNav: React.FC<WorkspaceNavProps> = ({
  currentView,
  onSelectView,
  activeProject,
  projects,
  onSelectProject,
  onOpenNewProject,
  activeMissionsCount = 0,
  filesCount = 0,
  artifactsCount = 0,
  memoriesCount = 0,
}) => {
  const navItems: Array<{
    id: WorkspaceView;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    {
      id: "chat",
      label: "Chat",
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: "missions",
      label: "Missions",
      icon: <Zap className="w-4 h-4" />,
      badge: activeMissionsCount > 0 ? activeMissionsCount : undefined,
      badgeColor: "bg-emerald-500 text-white animate-pulse",
    },
    {
      id: "projects",
      label: "Projects",
      icon: <FolderKanban className="w-4 h-4" />,
      badge: projects.length,
    },
    {
      id: "files",
      label: "Files",
      icon: <HardDrive className="w-4 h-4" />,
      badge: filesCount > 0 ? filesCount : undefined,
    },
    {
      id: "agents",
      label: "Agents & Tools",
      icon: <Bot className="w-4 h-4" />,
      badge: "8",
      badgeColor: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
    },
    {
      id: "artifacts",
      label: "Artifacts",
      icon: <Package className="w-4 h-4" />,
      badge: artifactsCount > 0 ? artifactsCount : undefined,
      badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    },
    {
      id: "memory",
      label: "Memory",
      icon: <Brain className="w-4 h-4" />,
      badge: memoriesCount > 0 ? memoriesCount : undefined,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/60 backdrop-blur-md px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 overflow-x-auto select-none no-scrollbar"
      id="workspace-nav"
    >
      {/* View Tabs */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              }`}
              id={`workspace-tab-${item.id}`}
            >
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    item.badgeColor ||
                    "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Project Indicator Pill */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <button
          onClick={() => onSelectView("projects")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs hover:bg-emerald-500/20 transition-colors"
          title="Current Active Project (Click to manage projects)"
          id="btn-active-project-pill"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold truncate max-w-[140px]">
            {activeProject?.name || "Main Workspace"}
          </span>
        </button>
      </div>
    </div>
  );
};
