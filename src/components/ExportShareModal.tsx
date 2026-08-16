import React, { useState } from "react";
import { Check, Copy, Download, FileCode, FileText, Share2, X } from "lucide-react";
import { Conversation } from "../types";
import {
  exportConversationToMarkdown,
  exportConversationToPlainText,
} from "../services/storage";

interface ExportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

export const ExportShareModal: React.FC<ExportShareModalProps> = ({
  isOpen,
  onClose,
  conversation,
}) => {
  const [format, setFormat] = useState<"markdown" | "json" | "text">("markdown");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !conversation) return null;

  let exportContent = "";
  let filename = "";

  if (format === "markdown") {
    exportContent = exportConversationToMarkdown(conversation);
    filename = `${conversation.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
  } else if (format === "json") {
    exportContent = JSON.stringify(conversation, null, 2);
    filename = `${conversation.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
  } else {
    exportContent = exportConversationToPlainText(conversation);
    filename = `${conversation.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = () => {
    const mime =
      format === "json"
        ? "application/json"
        : format === "markdown"
        ? "text/markdown"
        : "text/plain";
    const blob = new Blob([exportContent], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none"
      onClick={onClose}
      id="export-modal-backdrop"
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              Export / Share Conversation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Format Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Choose Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFormat("markdown")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  format === "markdown"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Markdown (.md)</span>
              </button>
              <button
                onClick={() => setFormat("json")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  format === "json"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <FileCode className="w-4 h-4" />
                <span>JSON (.json)</span>
              </button>
              <button
                onClick={() => setFormat("text")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  format === "text"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Plain Text (.txt)</span>
              </button>
            </div>
          </div>

          {/* Preview Box */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 max-h-56 overflow-auto font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed select-text">
            <pre className="whitespace-pre-wrap">{exportContent}</pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <span className="text-xs text-slate-400 font-mono">{filename}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Content</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
