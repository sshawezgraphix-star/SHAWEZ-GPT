import React, { useRef, useState } from "react";
import {
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  Search,
  Send,
  Tag,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { Project, ProjectFile } from "../../types";
import { MarkdownRenderer } from "../MarkdownRenderer";

interface FilesViewProps {
  project: Project;
  onAddFile: (file: any) => void;
  onDeleteFile: (fileId: string) => void;
  onAttachFileToChat?: (file: ProjectFile) => void;
  onAttachToChat?: (file: ProjectFile) => void;
  onLaunchMissionWithFile: (file: ProjectFile) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({
  project,
  onAddFile,
  onDeleteFile,
  onAttachFileToChat,
  onAttachToChat,
  onLaunchMissionWithFile,
}) => {
  const attachHandler = onAttachFileToChat || onAttachToChat || (() => {});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [inspectingFile, setInspectingFile] = useState<ProjectFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = project.files || [];

  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.tags && f.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedTypeFilter === "all" || f.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    Array.from(uploadedFiles).forEach((file) => {
      processUploadedFile(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processUploadedFile = (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isCode =
      file.name.endsWith(".ts") ||
      file.name.endsWith(".tsx") ||
      file.name.endsWith(".js") ||
      file.name.endsWith(".jsx") ||
      file.name.endsWith(".py") ||
      file.name.endsWith(".sql") ||
      file.name.endsWith(".html") ||
      file.name.endsWith(".css");
    const isData = file.name.endsWith(".json") || file.name.endsWith(".csv") || file.name.endsWith(".yaml");

    const fileType: ProjectFile["type"] = isImage ? "image" : isCode ? "code" : isData ? "data" : "document";

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newProjectFile: ProjectFile = {
          id: "file_" + Math.random().toString(36).substring(2, 9),
          projectId: project.id,
          name: file.name,
          type: "image",
          mimeType: file.type || "image/png",
          size: file.size,
          dataUrl: event.target?.result as string,
          uploadedAt: Date.now(),
          tags: ["image", file.name.split(".").pop() || ""],
        };
        onAddFile(newProjectFile);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const newProjectFile: ProjectFile = {
          id: "file_" + Math.random().toString(36).substring(2, 9),
          projectId: project.id,
          name: file.name,
          type: fileType,
          mimeType: file.type || "text/plain",
          size: file.size,
          textContent: text,
          uploadedAt: Date.now(),
          tags: [fileType, file.name.split(".").pop() || ""],
        };
        onAddFile(newProjectFile);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => processUploadedFile(file));
    }
  };

  const handleDownload = (file: ProjectFile) => {
    if (file.dataUrl) {
      const a = document.createElement("a");
      a.href = file.dataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else if (file.textContent) {
      const blob = new Blob([file.textContent], { type: file.mimeType || "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  };

  const copyContent = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = (type: ProjectFile["type"]) => {
    switch (type) {
      case "code":
        return <FileCode2 className="w-5 h-5 text-indigo-400" />;
      case "data":
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case "image":
        return <ImageIcon className="w-5 h-5 text-amber-400" />;
      default:
        return <FileText className="w-5 h-5 text-cyan-400" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8" id="files-view">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Project Files</h1>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Isolated in: {project.name}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Upload codebases, datasets, specifications, and media. Files are strictly accessible only within this project.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              id="input-file-upload"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              id="btn-upload-file"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Files</span>
            </button>
          </div>
        </div>

        {/* Drag and drop banner */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
              : "border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900"
          }`}
          id="dropzone-files"
        >
          <UploadCloud className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Drag and drop project files here, or <span className="text-emerald-500">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports TS, JS, Python, SQL, Markdown, JSON, CSV, PDF, PNG, SVG (up to 25MB)
          </p>
        </div>

        {/* Controls: Search & Type Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search files by name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              id="input-search-files"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Files" },
              { id: "document", label: "Documents" },
              { id: "code", label: "Code" },
              { id: "data", label: "Datasets" },
              { id: "image", label: "Images" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedTypeFilter === tab.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* File Cards / List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between group"
              id={`file-card-${file.id}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[170px]" title={file.name}>
                        {file.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <span className="capitalize">{file.type}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete File"
                    id={`btn-delete-file-${file.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {file.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {file.description}
                  </p>
                )}

                {/* Tags */}
                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {file.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => setInspectingFile(file)}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  title="Inspect File"
                  id={`btn-preview-file-${file.id}`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Inspect</span>
                </button>

                <button
                  onClick={() => attachHandler(file)}
                  className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs transition-colors"
                  title="Attach to Chat"
                  id={`btn-attach-chat-${file.id}`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onLaunchMissionWithFile(file)}
                  className="p-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs transition-colors"
                  title="Launch Mission with File"
                  id={`btn-launch-mission-file-${file.id}`}
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDownload(file)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  title="Download"
                  id={`btn-download-file-${file.id}`}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredFiles.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-3">
            <HardDrive className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-semibold">No files found</h3>
            <p className="text-xs text-slate-400">
              Upload files to give your agents code, datasets, and context for this project.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload First File</span>
            </button>
          </div>
        )}
      </div>

      {/* Inspect File Drawer / Modal */}
      {inspectingFile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                  {getFileIcon(inspectingFile.type)}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">{inspectingFile.name}</h3>
                  <p className="text-xs text-slate-400">
                    {formatBytes(inspectingFile.size)} • {inspectingFile.mimeType}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {inspectingFile.textContent && (
                  <button
                    onClick={() => copyContent(inspectingFile.textContent)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                )}
                <button
                  onClick={() => handleDownload(inspectingFile)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setInspectingFile(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950 font-mono text-xs">
              {inspectingFile.type === "image" && inspectingFile.dataUrl ? (
                <div className="flex justify-center p-4 bg-slate-900/40 rounded-xl">
                  <img
                    src={inspectingFile.dataUrl}
                    alt={inspectingFile.name}
                    className="max-h-[60vh] object-contain rounded-lg"
                  />
                </div>
              ) : inspectingFile.name.endsWith(".md") && inspectingFile.textContent ? (
                <div className="font-sans text-sm p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <MarkdownRenderer content={inspectingFile.textContent} />
                </div>
              ) : inspectingFile.textContent ? (
                <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
                  {inspectingFile.textContent}
                </pre>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  No preview available for binary file. Please download to view.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
