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
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 220);
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
        className={`relative rounded-2xl bg-[#09090d]/90 backdrop-blur-2xl border transition-all duration-200 shadow-[0_8px_32px_rgba(0,0,0,0.8)] ${
          isDragging
            ? "border-emerald-400 ring-2 ring-emerald-500/30 bg-emerald-950/20"
            : "border-white/10 focus-within:border-emerald-500/60 focus-within:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] focus-within:ring-1 focus-within:ring-emerald-500/40"
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
          <div className="flex flex-wrap gap-2 p-3 pb-1 border-b border-white/10">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-white/5 border border-white/10 text-xs group hover:border-emerald-500/30 transition-colors"
              >
                {att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-8 h-8 rounded-lg object-cover border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <FileText className="w-5 h-5 text-emerald-400" />
                )}
                <span className="max-w-[120px] truncate font-medium text-zinc-200">
                  {att.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-rose-400 transition-colors"
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
            className="w-full bg-transparent resize-none text-sm sm:text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:outline-none max-h-[220px]"
            id="chat-textarea"
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 text-zinc-400">
          <div className="flex items-center gap-1.5">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors border border-transparent hover:border-white/10"
              title="Attach images, documents or code"
              id="btn-attach-file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web Search Toggle */}
            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                enableWebSearch
                  ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "hover:bg-white/5 text-zinc-400 border-transparent hover:border-white/10"
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  orchestratorMode === "always"
                    ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border-emerald-400"
                    : orchestratorMode === "auto"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "hover:bg-white/5 text-zinc-500 border-transparent hover:border-white/10"
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
              className={`p-2 rounded-xl transition-all border ${
                isRecording
                  ? "bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)] border-rose-400"
                  : "hover:bg-white/5 text-zinc-400 hover:text-zinc-200 border-transparent hover:border-white/10"
              }`}
              title={isRecording ? "Stop voice recording" : "Dictate with Voice (STT)"}
              id="btn-voice-input"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 hidden md:inline">
              {content.length > 0 ? `${content.length} chars` : ""}
            </span>

            {/* Send / Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="p-2 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all flex items-center justify-center shadow-lg"
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
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer"
                    : "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed"
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
        <p className="text-[10px] font-mono text-zinc-500">
          ShawezGPT Ultra Intelligence · Powered by Shawez AI
        </p>
      </div>
    </div>
  );
};
