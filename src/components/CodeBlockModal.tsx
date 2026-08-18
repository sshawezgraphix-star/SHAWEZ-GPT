import React, { useState } from "react";
import { Check, Copy, Download, Play, Code2, Eye, X, RefreshCw } from "lucide-react";

interface CodeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
}

export const CodeBlockModal: React.FC<CodeBlockModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const isPreviewable =
    language === "html" ||
    language === "xml" ||
    language === "svg" ||
    code.includes("<!DOCTYPE html>") ||
    code.includes("<html") ||
    code.includes("<div") ||
    code.includes("<svg");

  const [activeTab, setActiveTab] = useState<"code" | "preview">(isPreviewable ? "preview" : "code");
  const [previewKey, setPreviewKey] = useState(0);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = () => {
    const ext =
      language === "typescript" || language === "ts"
        ? "ts"
        : language === "javascript" || language === "js"
        ? "js"
        : language === "python" || language === "py"
        ? "py"
        : language === "html"
        ? "html"
        : language === "css"
        ? "css"
        : language === "json"
        ? "json"
        : "txt";
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shawezgpt-code.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Prepare iframe HTML source
  const getIframeDoc = () => {
    if (code.includes("<!DOCTYPE html>") || code.includes("<html")) {
      return code;
    }
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; background: #ffffff; color: #0f172a; }
          </style>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
  };

  const lineCount = code.split("\n").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      id="code-block-modal"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-950/80 border-b border-slate-800 text-slate-300">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "code"
                    ? "bg-slate-900 text-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>

              {isPreviewable && (
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeTab === "preview"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Sandbox Preview</span>
                </button>
              )}
            </div>

            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {activeTab === "preview" && (
              <button
                onClick={() => setPreviewKey((k) => k + 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                title="Reload Preview"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
              id="modal-code-copy-btn"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Download code file"
              id="modal-code-download-btn"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              id="modal-code-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden bg-slate-950 relative">
          {activeTab === "preview" && isPreviewable ? (
            <iframe
              key={previewKey}
              srcDoc={getIframeDoc()}
              title="Interactive Code Sandbox"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <div className="p-4 sm:p-6 overflow-auto h-full font-mono text-sm leading-relaxed text-slate-200 selection:bg-emerald-500/30">
              <pre className="whitespace-pre overflow-x-auto">
                <code>{code}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
