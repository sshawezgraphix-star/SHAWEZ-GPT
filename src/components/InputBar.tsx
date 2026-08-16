import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Cpu,
  FileText,
  Globe,
  ImageIcon,
  Mic,
  MicOff,
  Paperclip,
  Square,
  X,
  Zap,
} from "lucide-react";
import { Attachment } from "../types";
import { SpeechManager } from "../services/speech";

interface InputBarProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  enableWebSearch: boolean;
  onToggleWebSearch: () => void;
  orchestratorMode?: "auto" | "always" | "off";
  onToggleOrchestratorMode?: () => void;
  disabled?: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  enableWebSearch,
  onToggleWebSearch,
  orchestratorMode = "auto",
  onToggleOrchestratorMode,
  disabled = false,
}) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  }, [content]);

  // Voice recognition handling
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsRecording(false);
    } else {
      const recognizer = SpeechManager.createRecognizer(
        (transcript) => {
          setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        (err) => {
          console.warn("Recognition error:", err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );

      if (recognizer) {
        recognitionRef.current = recognizer;
        recognizer.start();
        setIsRecording(true);
      } else {
        alert("Voice recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.");
      }
    }
  };

  // Handle file reading
  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();

      if (isImage) {
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          const newAtt: Attachment = {
            id: "att_" + Math.random().toString(36).substring(2, 9),
            name: file.name,
            type: "image",
            mimeType: file.type || "image/png",
            size: file.size,
            data: base64,
            previewUrl: base64,
          };
          setAttachments((prev) => [...prev, newAtt]);
        };
        reader.readAsDataURL(file);
      } else {
        // Text / code / json document
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const newAtt: Attachment = {
            id: "att_" + Math.random().toString(36).substring(2, 9),
            name: file.name,
            type: "document",
            mimeType: file.type || "text/plain",
            size: file.size,
            textContent: text,
          };
          setAttachments((prev) => [...prev, newAtt]);
        };
        reader.readAsText(file);
      }
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  // Clipboard paste support (e.g. screenshot paste)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          processFiles([file]);
          e.preventDefault();
        }
      }
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming) {
      onStopStreaming();
      return;
    }

    if (!content.trim() && attachments.length === 0) return;

    onSendMessage(content.trim(), attachments);
    setContent("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = Boolean(content.trim() || attachments.length > 0);

  return (
    <div
      className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4 pt-1 select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      id="chat-input-container"
    >
      <div
        className={`relative rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 ${
          isDragging
            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20"
            : "border-slate-200 dark:border-slate-800 focus-within:border-emerald-500/80 dark:focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20"
        }`}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          multiple
          className="hidden"
          accept="image/*,.txt,.md,.json,.ts,.tsx,.js,.jsx,.py,.html,.css,.csv"
          id="file-upload-input"
        />

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-1 border-b border-slate-100 dark:border-slate-800">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs group"
              >
                {att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-8 h-8 rounded-lg object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <FileText className="w-5 h-5 text-emerald-500" />
                )}
                <span className="max-w-[120px] truncate font-medium text-slate-700 dark:text-slate-300">
                  {att.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 transition-colors"
                  id={`remove-att-${att.id}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Textarea */}
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isRecording
                ? "Listening to voice input..."
                : isDragging
                ? "Drop images or files here..."
                : "Ask ShawezGPT anything... (Shift+Enter for new line)"
            }
            rows={1}
            disabled={disabled}
            className="w-full bg-transparent resize-none text-sm sm:text-[15px] leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none max-h-[200px]"
            id="chat-textarea"
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Attach images or documents"
              id="btn-attach-file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web Search Toggle */}
            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                enableWebSearch
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
              title={
                enableWebSearch
                  ? "Web search grounding active (Google Search)"
                  : "Enable real-time Web Search Grounding"
              }
              id="btn-toggle-web-search"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Orchestrator Mode Toggle */}
            {onToggleOrchestratorMode && (
              <button
                type="button"
                onClick={onToggleOrchestratorMode}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  orchestratorMode === "always"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : orchestratorMode === "auto"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500"
                }`}
                title={`Multi-Task Orchestrator: ${
                  orchestratorMode === "always"
                    ? "Always On (forces decomposition for all tasks)"
                    : orchestratorMode === "auto"
                    ? "Smart Auto (activates automatically for complex multi-step prompts)"
                    : "Off (standard single-turn generation)"
                }`}
                id="btn-toggle-orchestrator"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  Orchestrator {orchestratorMode === "always" ? "(On)" : orchestratorMode === "auto" ? "(Auto)" : "(Off)"}
                </span>
              </button>
            )}

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2 rounded-xl transition-all ${
                isRecording
                  ? "bg-rose-500 text-white animate-pulse"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
              title={isRecording ? "Stop voice recording" : "Dictate with Voice (STT)"}
              id="btn-voice-input"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden md:inline">
              {content.length > 0 ? `${content.length} chars` : ""}
            </span>

            {/* Send / Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="p-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity flex items-center justify-center"
                title="Stop generating"
                id="btn-stop-streaming"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!canSubmit || disabled}
                className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                  canSubmit && !disabled
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                }`}
                title="Send message (Enter)"
                id="btn-send-message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-2">
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          ShawezGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};
