import React, { useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileDown,
  FileText,
  Laptop,
  Maximize2,
  Minimize2,
  Smartphone,
  Tablet,
  X,
} from "lucide-react";
import { GeneratedArtifact } from "../../types";

interface ArtifactViewerModalProps {
  artifact: GeneratedArtifact | null;
  onClose: () => void;
}

export const ArtifactViewerModal: React.FC<ArtifactViewerModalProps> = ({
  artifact,
  onClose,
}) => {
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);

  if (!artifact) return null;

  const handleCopy = async () => {
    try {
      if (artifact.textContent) {
        await navigator.clipboard.writeText(artifact.textContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  const handleDownload = () => {
    if (artifact.dataUrl) {
      const link = document.createElement("a");
      link.href = artifact.dataUrl;
      link.download = artifact.filename || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (artifact.textContent) {
      const blob = new Blob([artifact.textContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = artifact.filename || `${artifact.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Preview dimensions for UI prototype
  const getDeviceWidth = () => {
    switch (deviceView) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      default:
        return "w-full";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      id="artifact-viewer-modal"
    >
      <div
        className="relative w-full max-w-5xl h-[88vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {artifact.type === "pdf" ? (
                <FileDown className="w-4 h-4" />
              ) : artifact.type === "ui_preview" ? (
                <Eye className="w-4 h-4" />
              ) : (
                <Code2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                {artifact.title}
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {artifact.filename || (artifact.type === "pdf" ? "document.pdf" : "deliverable")}
                {artifact.verified && (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                    ✓ Verified Artifact
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {artifact.type === "ui_preview" && (
              <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 mr-2">
                <button
                  onClick={() => setDeviceView("desktop")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    deviceView === "desktop"
                      ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                  title="Desktop View"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceView("tablet")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    deviceView === "tablet"
                      ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceView("mobile")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    deviceView === "mobile"
                      ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {artifact.textContent && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                id="btn-artifact-copy"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
              id="btn-artifact-download"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-1"
              id="btn-artifact-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-3 sm:p-6 overflow-auto flex items-center justify-center">
          {artifact.type === "pdf" ? (
            artifact.dataUrl ? (
              <iframe
                src={`${artifact.dataUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full rounded-xl bg-white shadow-md border border-slate-300 dark:border-slate-800"
                title={artifact.title}
              />
            ) : (
              <div className="w-full h-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl p-8 shadow-md border border-slate-200 dark:border-slate-800 overflow-y-auto font-serif text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
                <div className="border-b pb-4 mb-6 border-slate-200 dark:border-slate-800">
                  <span className="text-xs uppercase font-sans tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
                    ShawezGPT Intelligence Document
                  </span>
                  <h2 className="text-2xl font-bold font-sans mt-1">{artifact.title}</h2>
                  <p className="text-xs font-sans text-slate-400 mt-1">
                    Compiled and Verified on {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">
                  {artifact.textContent}
                </div>
              </div>
            )
          ) : artifact.type === "ui_preview" ? (
            <div className={`h-full transition-all duration-300 ${getDeviceWidth()} mx-auto flex flex-col`}>
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                <div className="h-7 bg-slate-100 dark:bg-slate-800 px-3 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-slate-400 font-mono mx-auto">sandbox://preview</span>
                </div>
                <iframe
                  srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 1rem; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900">
  ${artifact.textContent || "<div class='p-8 text-center'>UI Prototype Loaded</div>"}
</body>
</html>`}
                  className="w-full flex-1 border-0"
                  title="Interactive Prototype Sandbox"
                  sandbox="allow-scripts allow-forms"
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-full max-w-4xl bg-slate-900 rounded-xl p-4 shadow-xl border border-slate-800 overflow-auto font-mono text-xs text-slate-200">
              <pre className="whitespace-pre-wrap">{artifact.textContent}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
