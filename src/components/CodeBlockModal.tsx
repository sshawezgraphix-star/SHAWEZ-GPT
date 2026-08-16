import React, { useState } from "react";
import { Check, Copy, Download, Maximize2, Minimize2, X } from "lucide-react";

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
    const ext = language === "typescript" || language === "ts" ? "ts" : language === "javascript" || language === "js" ? "js" : language === "python" || language === "py" ? "py" : language === "html" ? "html" : language === "css" ? "css" : language === "json" ? "json" : "txt";
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shawezgpt-snippet.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = code.split("\n").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      id="code-block-modal"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/70 border-b border-slate-800 text-slate-300">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-semibold border border-slate-700">
              {language || "code"}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </span>
          </div>

          <div className="flex items-center gap-2">
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
                  <span>Copy Code</span>
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

        {/* Code Content */}
        <div className="p-5 overflow-auto flex-1 font-mono text-sm leading-relaxed text-slate-200 bg-slate-900/90 selection:bg-emerald-500/30">
          <pre className="whitespace-pre overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
