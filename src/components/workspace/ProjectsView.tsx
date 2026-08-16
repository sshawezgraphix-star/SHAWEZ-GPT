import React, { useState } from "react";
import {
  Archive,
  Bot,
  Check,
  Cpu,
  Database,
  Download,
  Edit2,
  FolderKanban,
  FolderPlus,
  Globe,
  HardDrive,
  Layers,
  MessageSquare,
  Package,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { Project } from "../../types";

interface ProjectsViewProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (data: { name: string; description: string; color?: string; icon?: string }) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onNavigateToView: (view: any) => void;
}

const COLOR_OPTIONS = [
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500", border: "border-emerald-500", text: "text-emerald-400" },
  { id: "indigo", label: "Indigo", bg: "bg-indigo-500", border: "border-indigo-500", text: "text-indigo-400" },
  { id: "amber", label: "Amber", bg: "bg-amber-500", border: "border-amber-500", text: "text-amber-400" },
  { id: "rose", label: "Rose", bg: "bg-rose-500", border: "border-rose-500", text: "text-rose-400" },
  { id: "cyan", label: "Cyan", bg: "bg-cyan-500", border: "border-cyan-500", text: "text-cyan-400" },
  { id: "purple", label: "Purple", bg: "bg-purple-500", border: "border-purple-500", text: "text-purple-400" },
];

const ICON_OPTIONS = [
  { id: "Sparkles", label: "Sparkles" },
  { id: "Cpu", label: "Hardware / AI" },
  { id: "Layers", label: "Fullstack / SaaS" },
  { id: "Globe", label: "Web / API" },
  { id: "Database", label: "Data / Systems" },
  { id: "Bot", label: "Agent Cluster" },
];

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onNavigateToView,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("emerald");
  const [selectedIcon, setSelectedIcon] = useState("Sparkles");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("emerald");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartCreate = () => {
    setName("");
    setDescription("");
    setSelectedColor("emerald");
    setSelectedIcon("Sparkles");
    setIsCreateModalOpen(true);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateProject({
      name: name.trim(),
      description: description.trim(),
      color: selectedColor,
      icon: selectedIcon,
    });
    setIsCreateModalOpen(false);
  };

  const handleStartEdit = (p: Project) => {
    setEditingProjectId(p.id);
    setEditName(p.name);
    setEditDescription(p.description);
    setEditColor(p.color || "emerald");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId || !editName.trim()) return;
    onUpdateProject(editingProjectId, {
      name: editName.trim(),
      description: editDescription.trim(),
      color: editColor,
    });
    setEditingProjectId(null);
  };

  const handleExportProject = (project: Project) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `project_${project.name.toLowerCase().replace(/\s+/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case "Cpu":
        return <Cpu className="w-5 h-5" />;
      case "Layers":
        return <Layers className="w-5 h-5" />;
      case "Globe":
        return <Globe className="w-5 h-5" />;
      case "Database":
        return <Database className="w-5 h-5" />;
      case "Bot":
        return <Bot className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8" id="projects-view">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* View Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Projects Hub</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Strictly isolated workspaces with independent chats, missions, files, artifacts, and memories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              id="btn-create-project-top"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            id="input-search-projects"
          />
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const isActive = project.id === activeProjectId;
            const convsCount = project.conversations?.length || 0;
            const filesCount = project.files?.length || 0;
            const missionsCount = project.missions?.length || 0;
            const artifactsCount = project.artifacts?.length || 0;
            const memoriesCount = project.memories?.length || 0;

            const colorObj = COLOR_OPTIONS.find((c) => c.id === project.color) || COLOR_OPTIONS[0];

            return (
              <div
                key={project.id}
                className={`relative rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group ${
                  isActive
                    ? "bg-white dark:bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg"
                    : "bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md"
                }`}
                id={`project-card-${project.id}`}
              >
                {/* Header info */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${colorObj.bg}/10 border ${colorObj.border}/30 ${colorObj.text}`}>
                        {renderIcon(project.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                            {project.name}
                          </h3>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(project)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        title="Edit Project"
                        id={`btn-edit-project-${project.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleExportProject(project)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        title="Export Project JSON"
                        id={`btn-export-project-${project.id}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {projects.length > 1 && (
                        <button
                          onClick={() => setDeleteConfirmId(project.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Delete Project"
                          id={`btn-delete-project-${project.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed min-h-[36px]">
                    {project.description || "No description provided."}
                  </p>

                  {/* Isolated Assets Metrics */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{convsCount}</div>
                      <div className="text-[10px] text-slate-400">Chats</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{filesCount}</div>
                      <div className="text-[10px] text-slate-400">Files</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{artifactsCount}</div>
                      <div className="text-[10px] text-slate-400">Artifacts</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{memoriesCount}</div>
                      <div className="text-[10px] text-slate-400">Memories</div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  {!isActive ? (
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                      id={`btn-switch-project-${project.id}`}
                    >
                      Switch to Workspace
                    </button>
                  ) : (
                    <div className="w-full flex items-center gap-2">
                      <button
                        onClick={() => onNavigateToView("chat")}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                      <button
                        onClick={() => onNavigateToView("missions")}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Missions</span>
                      </button>
                      <button
                        onClick={() => onNavigateToView("files")}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                        title="View Files"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-3">
            <FolderKanban className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-semibold">No matching projects found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search or create a new project workspace.</p>
            <button
              onClick={handleStartCreate}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold">Create New Project</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Quantum Edge Architectures"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  id="input-new-project-name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Goals, target deliverables, or focus domain..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  id="input-new-project-description"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Color Accent
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setSelectedColor(c.id)}
                      className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                        selectedColor === c.id ? "ring-2 ring-white scale-110 shadow-md" : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {selectedColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Icon Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ICON_OPTIONS.map((ic) => (
                    <button
                      type="button"
                      key={ic.id}
                      onClick={() => setSelectedIcon(ic.id)}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedIcon === ic.id
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold"
                          : "border-slate-700 hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      {renderIcon(ic.id)}
                      <span className="truncate">{ic.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
                  id="btn-save-new-project"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProjectId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold">Edit Project</h2>
              </div>
              <button
                onClick={() => setEditingProjectId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProjectId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-500">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-bold text-base">Delete Project Workspace?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete this project? All associated chats, files, artifacts, and isolated memories will be removed.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProject(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
