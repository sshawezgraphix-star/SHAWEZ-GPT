import React, { useState } from "react";
import {
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe,
  Layers,
  Laptop,
  Maximize2,
  Package,
  RefreshCw,
  Search,
  Smartphone,
  Tablet,
  X,
  Zap,
} from "lucide-react";
import { GeneratedArtifact, Project } from "../../types";
import { MarkdownRenderer } from "../MarkdownRenderer";

interface ArtifactsViewProps {
  project: Project;
  allProjects?: Project[];
  onDownloadArtifact?: (artifact: GeneratedArtifact) => void;
  onPreviewArtifact?: (artifact: GeneratedArtifact) => void;
}

export const ArtifactsView: React.FC<ArtifactsViewProps> = ({
  project,
  allProjects = [],
  onDownloadArtifact,
  onPreviewArtifact,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewArtifact, setPreviewArtifact] = useState<GeneratedArtifact | null>(null);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const [scope, setScope] = useState<"current" | "all">("current");

  // Collect artifacts based on scope
  const artifacts: GeneratedArtifact[] =
    scope === "all"
      ? allProjects.flatMap((p) => p.artifacts || [])
      : project.artifacts || [];

  const filteredArtifacts = artifacts.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.filename && art.filename.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.metadata?.description &&
        art.metadata.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.metadata?.category &&
        art.metadata.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "pdf" && (art.type === "pdf" || art.type === "report")) ||
      (selectedCategory === "ui" && art.type === "ui_preview") ||
      (selectedCategory === "code" && art.type === "code_file") ||
      (selectedCategory === "data" && art.type === "data_table");

    return matchesSearch && matchesCategory;
  });

  const handleCopy = (content?: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (art: GeneratedArtifact) => {
    if (onDownloadArtifact) {
      onDownloadArtifact(art);
      return;
    }
    const content = art.previewHtml || art.textContent || "";
    const mime =
      art.type === "ui_preview"
        ? "text/html"
        : art.type === "code_file"
        ? "text/typescript"
        : art.type === "data_table"
        ? "application/json"
        : "text/markdown";

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = art.filename || `${art.title.toLowerCase().replace(/\s+/g, "_")}.${art.type === "ui_preview" ? "html" : art.type === "code_file" ? "ts" : "txt"}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const getArtifactIcon = (type: GeneratedArtifact["type"]) => {
    switch (type) {
      case "ui_preview":
        return <Globe className="w-5 h-5 text-indigo-400" />;
      case "pdf":
      case "report":
        return <FileText className="w-5 h-5 text-rose-400" />;
      case "code_file":
        return <FileCode2 className="w-5 h-5 text-emerald-400" />;
      case "data_table":
        return <FileSpreadsheet className="w-5 h-5 text-amber-400" />;
      default:
        return <Package className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8" id="artifacts-view">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Artifact Library</h1>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {scope === "current" ? `Viewing: ${project.name}` : "Viewing: All Workspace Projects"}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Search, inspect, and export generated publications, interactive HTML dashboards, and code deliverables.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setScope("current")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  scope === "current"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Active Project
              </button>
              <button
                onClick={() => setScope("all")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  scope === "all"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All Projects
              </button>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search artifacts by title, filename, or framework..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              id="input-search-artifacts"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Artifacts" },
              { id: "pdf", label: "PDFs & Reports" },
              { id: "ui", label: "Interactive UI" },
              { id: "code", label: "Code Files" },
              { id: "data", label: "Data Tables" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === tab.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Artifacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArtifacts.map((art) => {
            const isUi = art.type === "ui_preview";
            const isPdf = art.type === "pdf" || art.type === "report";

            return (
              <div
                key={art.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group"
                id={`artifact-card-${art.id}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                      {getArtifactIcon(art.type)}
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {art.type.replace("_", " ")}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {art.title}
                    </h3>
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                      {art.filename}
                    </div>
                  </div>

                  {art.metadata?.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {art.metadata.description}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {art.metadata?.framework && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-medium">
                        {art.metadata.framework}
                      </span>
                    )}
                    {art.metadata?.pageCount && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-medium">
                        {art.metadata.pageCount} Pages
                      </span>
                    )}
                    {art.metadata?.category && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                        {art.metadata.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setPreviewArtifact(art)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    id={`btn-inspect-artifact-${art.id}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>

                  <button
                    onClick={() => handleDownload(art)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                    title="Download Artifact"
                    id={`btn-download-artifact-${art.id}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredArtifacts.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-3">
            <Package className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-semibold">No artifacts found</h3>
            <p className="text-xs text-slate-400">
              Run a Mission or autonomous research task to generate executive PDF reports, UI sandboxes, and data dashboards.
            </p>
          </div>
        )}
      </div>

      {/* Artifact Preview & Live Iframe Sandbox Modal */}
      {previewArtifact && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-5xl h-[88vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Top Toolbar */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0">
                  {getArtifactIcon(previewArtifact.type)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base truncate">{previewArtifact.title}</h3>
                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate">
                    {previewArtifact.filename}
                  </p>
                </div>
              </div>

              {/* Viewport switcher for UI previews */}
              {previewArtifact.type === "ui_preview" && (
                <div className="hidden sm:flex items-center bg-slate-200 dark:bg-slate-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setPreviewViewport("desktop")}
                    className={`p-1.5 rounded-lg ${
                      previewViewport === "desktop" ? "bg-white dark:bg-slate-700 text-emerald-400" : "text-slate-400"
                    }`}
                    title="Desktop (100%)"
                  >
                    <Laptop className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewViewport("tablet")}
                    className={`p-1.5 rounded-lg ${
                      previewViewport === "tablet" ? "bg-white dark:bg-slate-700 text-emerald-400" : "text-slate-400"
                    }`}
                    title="Tablet (768px)"
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewViewport("mobile")}
                    className={`p-1.5 rounded-lg ${
                      previewViewport === "mobile" ? "bg-white dark:bg-slate-700 text-emerald-400" : "text-slate-400"
                    }`}
                    title="Mobile (375px)"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(previewArtifact.previewHtml || previewArtifact.textContent)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={() => handleDownload(previewArtifact)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewArtifact(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-hidden bg-slate-950 flex items-center justify-center p-2 sm:p-4">
              {previewArtifact.type === "ui_preview" && previewArtifact.previewHtml ? (
                <div
                  className={`h-full bg-white transition-all rounded-xl overflow-hidden border border-slate-800 shadow-2xl ${
                    previewViewport === "desktop"
                      ? "w-full"
                      : previewViewport === "tablet"
                      ? "w-[768px]"
                      : "w-[375px]"
                  }`}
                >
                  <iframe
                    srcDoc={previewArtifact.previewHtml}
                    title={previewArtifact.title}
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (
                <div className="w-full h-full overflow-y-auto bg-slate-900 rounded-xl p-6 border border-slate-800 font-sans text-slate-100">
                  <MarkdownRenderer content={previewArtifact.textContent || "No text content available."} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
