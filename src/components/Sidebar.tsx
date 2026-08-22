import React, { useState } from "react";
import {
  Archive,
  Bot,
  Brain,
  Check,
  ChevronDown,
  Cpu,
  Download,
  Edit2,
  FolderKanban,
  FolderPlus,
  HardDrive,
  Layers,
  MessageSquare,
  MoreVertical,
  Package,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";
import { Conversation, Project, UserProfile, WorkspaceView } from "../types";
import { BrandLogo } from "./BrandLogo";
import { getStorageUsage } from "../services/storage";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  onExportConversation: (conv: Conversation) => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenRegistry?: () => void;
  onOpenMemory?: () => void;
  user: UserProfile;
  // Workspace and Project Isolation props
  projects?: Project[];
  activeProjectId?: string;
  onSelectProject?: (id: string) => void;
  onOpenNewProject?: () => void;
  onNavigateToView?: (view: WorkspaceView) => void;
  currentView?: WorkspaceView;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  onExportConversation,
  onOpenSettings,
  onOpenAuth,
  onOpenRegistry,
  onOpenMemory,
  user,
  projects = [],
  activeProjectId = "prj_default",
  onSelectProject,
  onOpenNewProject,
  onNavigateToView,
  currentView = "chat",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const storageUsage = getStorageUsage();

  // Filter conversations
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedConversations = filtered.filter((c) => c.isPinned);
  const unpinnedConversations = filtered.filter((c) => !c.isPinned);

  // Group by time
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const today = unpinnedConversations.filter((c) => now - c.updatedAt < ONE_DAY);
  const yesterday = unpinnedConversations.filter(
    (c) => now - c.updatedAt >= ONE_DAY && now - c.updatedAt < 2 * ONE_DAY
  );
  const previous7Days = unpinnedConversations.filter(
    (c) => now - c.updatedAt >= 2 * ONE_DAY && now - c.updatedAt < 7 * ONE_DAY
  );
  const older = unpinnedConversations.filter((c) => now - c.updatedAt >= 7 * ONE_DAY);

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-[#050508] border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out select-none shadow-[4px_0_24px_rgba(0,0,0,0.8)] ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        id="app-sidebar"
      >
        {/* Top Header & Brand */}
        <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/40">
          <BrandLogo size="md" />
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            id="btn-close-sidebar-mobile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Selector Dropdown in Sidebar */}
        {projects.length > 0 && (
          <div className="px-3 pt-3">
            <div className="relative">
              <button
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#0c0c12] border border-white/10 hover:border-emerald-500/40 transition-all text-left group"
                id="sidebar-project-selector"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 group-hover:scale-105 transition-transform">
                    <FolderKanban className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                      Workspace Project
                    </div>
                    <div className="text-xs font-bold text-zinc-100 truncate">
                      {activeProject?.name || "Main Workspace"}
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 shrink-0 ml-1 transition-colors" />
              </button>

              {projectDropdownOpen && (
                <div
                  className="absolute left-0 top-full mt-1.5 w-full bg-[#09090d]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in"
                  id="sidebar-project-dropdown"
                >
                  <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    Switch Workspace Project
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 my-1">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (onSelectProject) onSelectProject(p.id);
                          setProjectDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors ${
                          p.id === activeProjectId
                            ? "bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30"
                            : "text-zinc-300 hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500 ml-1 shrink-0">
                          {p.conversations?.length || 0} chats
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="pt-1.5 border-t border-white/10">
                    <button
                      onClick={() => {
                        if (onNavigateToView) onNavigateToView("projects");
                        setProjectDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-500/15 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Manage All Projects</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* New Chat & Search Input */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              if (onNavigateToView) onNavigateToView("chat");
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all group cursor-pointer border border-emerald-400/30"
            id="btn-sidebar-new-chat"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-black/30 text-emerald-200 rounded border border-emerald-400/30">
              ⌘K
            </kbd>
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-7 py-2 rounded-xl bg-[#0a0a0f] border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              id="sidebar-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="text-xs font-medium">
                {searchQuery ? "No matching chats found" : "No chats in this workspace yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Pinned Section */}
              {pinnedConversations.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-500">
                    <Pin className="w-3 h-3" />
                    <span>Pinned</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {pinnedConversations.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conv={conv}
                        isActive={conv.id === activeId && currentView === "chat"}
                        isEditing={editingId === conv.id}
                        editTitle={editTitle}
                        setEditTitle={setEditTitle}
                        onSaveRename={() => handleSaveRename(conv.id)}
                        onCancelRename={() => setEditingId(null)}
                        onStartRename={() => handleStartRename(conv)}
                        onSelect={() => {
                          if (onNavigateToView) onNavigateToView("chat");
                          onSelectConversation(conv.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        onDelete={() => setDeleteConfirmId(conv.id)}
                        onTogglePin={() => onTogglePinConversation(conv.id)}
                        onExport={() => onExportConversation(conv)}
                        isMenuOpen={menuOpenId === conv.id}
                        setMenuOpen={(open) => setMenuOpenId(open ? conv.id : null)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Today */}
              {today.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                    Today
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {today.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conv={conv}
                        isActive={conv.id === activeId && currentView === "chat"}
                        isEditing={editingId === conv.id}
                        editTitle={editTitle}
                        setEditTitle={setEditTitle}
                        onSaveRename={() => handleSaveRename(conv.id)}
                        onCancelRename={() => setEditingId(null)}
                        onStartRename={() => handleStartRename(conv)}
                        onSelect={() => {
                          if (onNavigateToView) onNavigateToView("chat");
                          onSelectConversation(conv.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        onDelete={() => setDeleteConfirmId(conv.id)}
                        onTogglePin={() => onTogglePinConversation(conv.id)}
                        onExport={() => onExportConversation(conv)}
                        isMenuOpen={menuOpenId === conv.id}
                        setMenuOpen={(open) => setMenuOpenId(open ? conv.id : null)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Yesterday */}
              {yesterday.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                    Yesterday
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {yesterday.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conv={conv}
                        isActive={conv.id === activeId && currentView === "chat"}
                        isEditing={editingId === conv.id}
                        editTitle={editTitle}
                        setEditTitle={setEditTitle}
                        onSaveRename={() => handleSaveRename(conv.id)}
                        onCancelRename={() => setEditingId(null)}
                        onStartRename={() => handleStartRename(conv)}
                        onSelect={() => {
                          if (onNavigateToView) onNavigateToView("chat");
                          onSelectConversation(conv.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        onDelete={() => setDeleteConfirmId(conv.id)}
                        onTogglePin={() => onTogglePinConversation(conv.id)}
                        onExport={() => onExportConversation(conv)}
                        isMenuOpen={menuOpenId === conv.id}
                        setMenuOpen={(open) => setMenuOpenId(open ? conv.id : null)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Previous 7 Days */}
              {previous7Days.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                    Previous 7 Days
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {previous7Days.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conv={conv}
                        isActive={conv.id === activeId && currentView === "chat"}
                        isEditing={editingId === conv.id}
                        editTitle={editTitle}
                        setEditTitle={setEditTitle}
                        onSaveRename={() => handleSaveRename(conv.id)}
                        onCancelRename={() => setEditingId(null)}
                        onStartRename={() => handleStartRename(conv)}
                        onSelect={() => {
                          if (onNavigateToView) onNavigateToView("chat");
                          onSelectConversation(conv.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        onDelete={() => setDeleteConfirmId(conv.id)}
                        onTogglePin={() => onTogglePinConversation(conv.id)}
                        onExport={() => onExportConversation(conv)}
                        isMenuOpen={menuOpenId === conv.id}
                        setMenuOpen={(open) => setMenuOpenId(open ? conv.id : null)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Older */}
              {older.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                    Older
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {older.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conv={conv}
                        isActive={conv.id === activeId && currentView === "chat"}
                        isEditing={editingId === conv.id}
                        editTitle={editTitle}
                        setEditTitle={setEditTitle}
                        onSaveRename={() => handleSaveRename(conv.id)}
                        onCancelRename={() => setEditingId(null)}
                        onStartRename={() => handleStartRename(conv)}
                        onSelect={() => {
                          if (onNavigateToView) onNavigateToView("chat");
                          onSelectConversation(conv.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        onDelete={() => setDeleteConfirmId(conv.id)}
                        onTogglePin={() => onTogglePinConversation(conv.id)}
                        onExport={() => onExportConversation(conv)}
                        isMenuOpen={menuOpenId === conv.id}
                        setMenuOpen={(open) => setMenuOpenId(open ? conv.id : null)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-500">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 dark:text-white">Delete Chat?</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                This will permanently remove this conversation and all associated messages.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirmId) {
                      onDeleteConversation(deleteConfirmId);
                      setDeleteConfirmId(null);
                    }
                  }}
                  className="px-3.5 py-1.5 text-xs rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom User Profile & Storage */}
        <div className="p-3 border-t border-white/10 bg-black/40 space-y-2">
          {/* Quick Engine Controls */}
          <div className="grid grid-cols-2 gap-1.5">
            {onNavigateToView && (
              <>
                <button
                  onClick={() => onNavigateToView("missions")}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                    currentView === "missions"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10"
                  }`}
                  id="sidebar-btn-missions"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Missions</span>
                </button>
                <button
                  onClick={() => onNavigateToView("files")}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                    currentView === "files"
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                      : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10"
                  }`}
                  id="sidebar-btn-files"
                >
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Files</span>
                </button>
              </>
            )}
          </div>

          {/* Storage mini-meter */}
          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-zinc-400" />
              <span>Storage</span>
            </div>
            <span className="text-zinc-400">{storageUsage.usedKb} KB / 5 MB</span>
          </div>

          {/* Profile Button */}
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-[#0c0c12] hover:bg-[#151520] border border-white/10 hover:border-emerald-500/40 transition-all"
            id="sidebar-user-btn"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-xl object-cover bg-emerald-500/20 border border-emerald-500/30 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold text-zinc-100 truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-emerald-400 font-mono truncate">
                  {user.plan} · PRO
                </p>
              </div>
            </div>
            <Settings className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
          </button>
        </div>
      </aside>
    </>
  );
};


// Single Conversation Row Component
interface ConversationItemProps {
  conv: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (val: string) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onStartRename: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onExport: () => void;
  isMenuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conv,
  isActive,
  isEditing,
  editTitle,
  setEditTitle,
  onSaveRename,
  onCancelRename,
  onStartRename,
  onSelect,
  onDelete,
  onTogglePin,
  onExport,
  isMenuOpen,
  setMenuOpen,
}) => {
  return (
    <div className="relative group select-none">
      {isEditing ? (
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveRename();
              if (e.key === "Escape") onCancelRename();
            }}
            autoFocus
            className="flex-1 px-2 py-1 text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            onClick={onSaveRename}
            className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCancelRename}
            className="p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={onSelect}
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
            isActive
              ? "bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 font-bold shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent"
          }`}
          id={`conv-item-${conv.id}`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {conv.isPinned ? (
              <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            )}
            <span className="truncate">{conv.title || "Untitled Chat"}</span>
          </div>

          {/* Action Trigger Menu */}
          <div className="relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!isMenuOpen);
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
              id={`conv-menu-btn-${conv.id}`}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-[#09090d]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-1 z-30 text-xs animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    onTogglePin();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-zinc-300 hover:bg-white/10"
                >
                  {conv.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  <span>{conv.isPinned ? "Unpin" : "Pin"}</span>
                </button>
                <button
                  onClick={onStartRename}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-zinc-300 hover:bg-white/10"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => {
                    onExport();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-zinc-300 hover:bg-white/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-rose-400 hover:bg-rose-950/40 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
