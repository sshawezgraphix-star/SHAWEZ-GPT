import React, { useState } from "react";
import {
  AlertCircle,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit2,
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  Share2,
  ThumbsDown,
  ThumbsUp,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Attachment, GeneratedArtifact, GroundingSource, Message, MissionState } from "../types";
import { BrandLogo } from "./BrandLogo";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { SpeechManager } from "../services/speech";
import { TaskOrchestratorView } from "./orchestrator/TaskOrchestratorView";
import { MissionDashboard } from "./orchestrator/MissionDashboard";

interface MessageItemProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: () => void;
  onEditMessage?: (newContent: string) => void;
  onReaction?: (type: "liked" | "disliked") => void;
  onPreviewArtifact?: (artifact: GeneratedArtifact) => void;
  onMissionUpdate?: (updated: MissionState) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isLast,
  onRegenerate,
  onEditMessage,
  onReaction,
  onPreviewArtifact,
  onMissionUpdate,
}) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      SpeechManager.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      SpeechManager.speak(message.content, {
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue !== message.content) {
      onEditMessage?.(editValue.trim());
      setIsEditing(false);
    } else {
      setIsEditing(false);
    }
  };

  const wordCount = message.content.trim() ? message.content.trim().split(/\s+/).length : 0;

  return (
    <div
      className={`group py-4 px-3 sm:px-6 transition-colors rounded-2xl my-2 ${
        isUser
          ? "bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 ml-auto max-w-[92%] sm:max-w-[85%]"
          : "bg-transparent w-full"
      }`}
      id={`message-${message.id}`}
    >
      <div className="flex items-start gap-3 sm:gap-4 max-w-4xl mx-auto">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-sm">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <BrandLogo size="sm" showText={false} />
          )}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0">
          {/* Header info */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {isUser ? "You" : "ShawezGPT"}
              </span>
              {message.modelUsed && !isUser && (
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {message.modelUsed}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Attachments (if any) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2.5 my-2.5">
              {message.attachments.map((att) => (
                <AttachmentBadge key={att.id} attachment={att} />
              ))}
            </div>
          )}

          {/* Inline Edit Form for User Message */}
          {isEditing ? (
            <div className="my-2 space-y-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={3}
                className="w-full p-2.5 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditValue(message.content);
                  }}
                  className="px-3 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm"
                >
                  Save & Regenerate
                </button>
              </div>
            </div>
          ) : (
            /* Message Content */
            <div className="text-sm sm:text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">
              {/* Mission Mode Dashboard Component */}
              {message.missionState && !isUser && (
                <MissionDashboard
                  mission={message.missionState}
                  onMissionUpdate={onMissionUpdate}
                  onPreviewArtifact={onPreviewArtifact}
                />
              )}

              {/* Task Orchestrator Component */}
              {message.orchestrationPlan && !isUser && (
                <TaskOrchestratorView
                  plan={message.orchestrationPlan}
                  onPreviewArtifact={onPreviewArtifact}
                  isStreaming={message.isStreaming}
                />
              )}

              {message.error ? (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 flex items-start gap-2.5 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Generation Notice</p>
                    <p>{message.error}</p>
                  </div>
                </div>
              ) : isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                message.content && (
                  <div className="relative">
                    <MarkdownRenderer content={message.content} />
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* Web Search Sources / Grounding */}
          {message.groundingSources && message.groundingSources.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>
                  {message.groundingSources.length}{" "}
                  {message.groundingSources.length === 1 ? "Source" : "Sources"} Grounded
                </span>
                {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showSources && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in">
                  {message.groundingSources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-colors flex items-center gap-2 group"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-500">
                          {source.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{source.uri}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Toolbar */}
          {!message.isStreaming && (
            <div className="flex items-center gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors"
                title="Copy message"
                id={`btn-copy-${message.id}`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleSpeak}
                className={`p-1.5 rounded-lg transition-colors ${
                  isSpeaking
                    ? "text-emerald-500 bg-emerald-500/10"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60"
                }`}
                title={isSpeaking ? "Stop Speaking" : "Read Aloud (TTS)"}
                id={`btn-speak-${message.id}`}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {isUser ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors"
                  title="Edit prompt"
                  id={`btn-edit-${message.id}`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  {isLast && onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors"
                      title="Regenerate response"
                      id={`btn-regen-${message.id}`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onReaction?.("liked")}
                    className={`p-1.5 rounded-lg transition-colors ${
                      message.reactions?.liked
                        ? "text-emerald-500 bg-emerald-500/10"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60"
                    }`}
                    title="Good response"
                    id={`btn-like-${message.id}`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onReaction?.("disliked")}
                    className={`p-1.5 rounded-lg transition-colors ${
                      message.reactions?.disliked
                        ? "text-rose-500 bg-rose-500/10"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60"
                    }`}
                    title="Poor response"
                    id={`btn-dislike-${message.id}`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {/* Word count stats */}
              <span className="text-[10px] text-slate-400 ml-auto select-none">
                {wordCount} words
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Attachment Card/Thumbnail renderer
const AttachmentBadge: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const isImage = attachment.type === "image" || attachment.mimeType.startsWith("image/");
  const sizeKb = Math.round(attachment.size / 1024);

  return (
    <div className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-xs overflow-hidden">
      {isImage && (attachment.data || attachment.previewUrl) ? (
        <img
          src={attachment.data || attachment.previewUrl}
          alt={attachment.name}
          className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-800 shrink-0"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
          {attachment.name}
        </p>
        <p className="text-[10px] text-slate-400 uppercase font-mono">
          {sizeKb > 0 ? `${sizeKb} KB` : "File"}
        </p>
      </div>
    </div>
  );
};
