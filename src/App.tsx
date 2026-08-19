import React, { useEffect, useRef, useState } from "react";
import {
  Attachment,
  Conversation,
  GeneratedArtifact,
  Message,
  MissionState,
  OrchestrationPlan,
  Project,
  ProjectFile,
  UserProfile,
  WorkspaceView,
} from "./types";
import { DEFAULT_MODELS, PERSONAS } from "./data/models";
import {
  DEFAULT_SETTINGS,
  DEFAULT_USER,
  addProjectArtifact,
  addProjectFile,
  createProject,
  deleteProject,
  deleteProjectFile,
  loadActiveConversationId,
  loadActiveProjectId,
  loadConversations,
  loadProjects,
  loadSettings,
  loadUserProfile,
  saveActiveConversationId,
  saveActiveProjectId,
  saveConversations,
  saveProjects,
  saveSettings,
  saveUserProfile,
  updateProject,
} from "./services/storage";
import {
  fetchAvailableModels,
  generateChatTitle,
  shouldOrchestrate,
  streamChatMessage,
  streamMissionMode,
  streamTaskOrchestration,
} from "./services/api";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { MessageItem } from "./components/MessageItem";
import { InputBar } from "./components/InputBar";
import { SettingsModal } from "./components/SettingsModal";
import { ResumeBuilderModal } from "./components/ResumeBuilderModal";
import { ImageStudioModal } from "./components/ImageStudioModal";
import { AuthModal } from "./components/AuthModal";
import { ExportShareModal } from "./components/ExportShareModal";
import { ArtifactViewerModal } from "./components/orchestrator/ArtifactViewerModal";
import { AgentRegistryModal } from "./components/orchestrator/AgentRegistryModal";
import { MemoryManagerModal } from "./components/memory/MemoryManagerModal";
import { WorkspaceNav } from "./components/workspace/WorkspaceNav";
import { ProjectsView } from "./components/workspace/ProjectsView";
import { FilesView } from "./components/workspace/FilesView";
import { ArtifactsView } from "./components/workspace/ArtifactsView";
import { AgentsView } from "./components/workspace/AgentsView";
import { MemoryView } from "./components/workspace/MemoryView";
import { MissionsView } from "./components/workspace/MissionsView";
import { ArrowDown } from "lucide-react";

export default function App() {
  // Projects & Workspace State
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => loadActiveProjectId());
  const [currentView, setCurrentView] = useState<WorkspaceView>("chat");
  const [activeMission, setActiveMission] = useState<MissionState | null>(null);

  // Chat & Storage State
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveConversationId());
  const [settings, setSettings] = useState(() => loadSettings());
  const [user, setUser] = useState<UserProfile>(() => loadUserProfile());
  const [models, setModels] = useState(DEFAULT_MODELS);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isResumeStudioOpen, setIsResumeStudioOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [previewArtifact, setPreviewArtifact] = useState<GeneratedArtifact | null>(null);

  // Active Model & Persona state
  const [selectedModelId, setSelectedModelId] = useState<string>(settings.defaultModelId);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(settings.defaultPersonaId);
  const [enableWebSearch, setEnableWebSearch] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  // Sync projects and active context to local storage
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveActiveProjectId(activeProjectId);
  }, [activeProjectId]);

  // Sync state to local storage
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveActiveConversationId(activeId);
  }, [activeId]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveUserProfile(user);
  }, [user]);

  // Project Switching handler
  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    saveActiveProjectId(projectId);
    const targetProject = projects.find((p) => p.id === projectId);
    if (targetProject) {
      setConversations(targetProject.conversations || []);
      setActiveId(targetProject.conversations && targetProject.conversations.length > 0 ? targetProject.conversations[0].id : null);
    }
  };

  // Project CRUD Handlers
  const handleCreateProject = (data: { name: string; description: string; color?: string; icon?: string }) => {
    const newProj = createProject(data);
    setProjects(loadProjects());
    handleSelectProject(newProj.id);
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    updateProject(id, updates);
    setProjects(loadProjects());
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    const updated = loadProjects();
    setProjects(updated);
    if (id === activeProjectId && updated.length > 0) {
      handleSelectProject(updated[0].id);
    }
  };

  // File Handlers
  const handleAddFile = (file: Omit<ProjectFile, "id" | "uploadedAt">) => {
    addProjectFile(activeProjectId, file);
    setProjects(loadProjects());
  };

  const handleDeleteFile = (fileId: string) => {
    deleteProjectFile(activeProjectId, fileId);
    setProjects(loadProjects());
  };

  const handleAttachFileToChat = (file: ProjectFile) => {
    setCurrentView("chat");
    const fileBody = file.textContent || file.content || "";
    const attachment: Attachment = {
      id: "att_" + Math.random().toString(36).substring(2, 9),
      name: file.name,
      type: file.type,
      mimeType: file.type === "image" ? "image/png" : "text/plain",
      size: file.size,
      textContent: fileBody,
      data: file.dataUrl,
    };
    handleSendMessage(`Please analyze this project file: ${file.name}\n\n\`\`\`${file.type}\n${fileBody.slice(0, 1500)}\n\`\`\``, [attachment]);
  };

  const handleLaunchMissionWithFile = (file: ProjectFile) => {
    setCurrentView("missions");
    const objective = `Analyze and evaluate project file "${file.name}" (size: ${file.size} bytes), verify key architecture components, and synthesize a full technical report.`;
    handleSendMessage(`/mission ${objective}`);
  };

  const handleLaunchMissionFromDashboard = (objective: string) => {
    handleSendMessage(`/mission ${objective}`);
  };

  // Load server models on startup
  useEffect(() => {
    fetchAvailableModels().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setModels(fetched);
      }
    });
  }, []);

  // Handle Theme switching
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else if (settings.theme === "light") {
      root.classList.remove("dark");
    } else {
      // System
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isSystemDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [settings.theme]);

  // Global Keyboard Shortcuts (Cmd/Ctrl+K for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Scroll listener for floating scroll-to-bottom button
  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isFarFromBottom);
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Find active conversation
  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // New Chat
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setActiveId(null);
    setSelectedModelId(settings.defaultModelId);
    setSelectedPersonaId(settings.defaultPersonaId);
    setEnableWebSearch(false);
  };

  // Stop current streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Update active message streaming state
    if (activeId) {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== activeId) return conv;
          const updatedMessages = conv.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          );
          return { ...conv, messages: updatedMessages };
        })
      );
    }
  };

  // Send message handler
  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    if (isStreaming) return;

    let targetConvId = activeId;
    let currentConv = activeConversation;
    const now = Date.now();
    const isMission =
      content.toLowerCase().startsWith("/mission") ||
      content.toLowerCase().startsWith("mission:") ||
      content.toLowerCase().startsWith("objective:") ||
      content.toLowerCase().includes("mission mode") ||
      content.toLowerCase().includes("autonomous objective") ||
      content.toLowerCase().includes("execute as a mission");

    const isOrchestrated = !isMission && shouldOrchestrate(content, settings.orchestratorMode || "auto");

    const userMessage: Message = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      role: "user",
      content,
      attachments,
      timestamp: now,
    };

    const assistantMessageId = "msg_" + Math.random().toString(36).substring(2, 9);
    const initialPlan: OrchestrationPlan | undefined = isOrchestrated
      ? {
          id: "plan_" + Math.random().toString(36).substring(2, 9),
          userGoal: content,
          detectedIntent: "Analyzing multi-task objectives...",
          complexityScore: "high",
          phase: "planning",
          currentStepIndex: 0,
          subtasks: [],
          artifacts: [],
          startedAt: now,
        }
      : undefined;

    const initialMission: MissionState | undefined = isMission
      ? {
          id: "mission_" + Math.random().toString(36).substring(2, 9),
          objective: content.replace(/^(\/mission|mission:|objective:)\s*/i, "").trim() || content,
          detectedIntent: "Analyzing autonomous mission scope and DAG dependencies...",
          scope: ["Autonomous execution plan", "Dependency wave ordering", "Result verification"],
          constraints: ["Verify each output", "Approval gate for irreversible actions"],
          targetDeliverables: ["Executive synthesis report", "Verified deliverables & code artifacts"],
          phase: "planning",
          controlState: "running",
          overallProgress: 5,
          startedAt: now,
          dag: { totalTasks: 0, stages: [], dependencies: {}, estimatedTotalDurationMs: 3000 },
          tasks: [],
          activeAgentIds: [],
          activeAgentNames: ["DAG Planner Engine"],
          completedTaskCount: 0,
          failedTaskCount: 0,
          retriedTaskCount: 0,
          artifacts: [],
          pendingApprovals: [],
          resolvedApprovals: [],
        }
      : undefined;

    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: now + 1,
      modelUsed: selectedModelId,
      isStreaming: true,
      orchestrationPlan: initialPlan,
      missionState: initialMission,
      isMissionMode: isMission,
    };

    let isFirstMessage = false;

    if (!targetConvId || !currentConv) {
      // Create new conversation
      isFirstMessage = true;
      const newConvId = "conv_" + Math.random().toString(36).substring(2, 9);
      const newConv: Conversation = {
        id: newConvId,
        title: content.slice(0, 30) || "New Chat",
        createdAt: now,
        updatedAt: now,
        messages: [userMessage, assistantMessage],
        modelId: selectedModelId,
        personaId: selectedPersonaId,
        enableWebSearch,
      };

      targetConvId = newConvId;
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConvId);
      currentConv = newConv;
    } else {
      // Append to existing conversation
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== targetConvId) return conv;
          return {
            ...conv,
            updatedAt: now,
            messages: [...conv.messages, userMessage, assistantMessage],
          };
        })
      );
    }

    // Scroll to bottom immediately
    setTimeout(() => scrollToBottom("auto"), 50);

    // Prepare streaming
    setIsStreaming(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Get active persona system prompt
    const activePersona = PERSONAS.find((p) => p.id === selectedPersonaId);
    const systemInstruction = activePersona?.systemPrompt || "";

    const fullMessages = currentConv
      ? [...currentConv.messages.filter((m) => !m.isStreaming), userMessage]
      : [userMessage];

    try {
      if (isMission) {
        // Autonomous Mission Mode Flow
        const cleanObjective = content.replace(/^(\/mission|mission:|objective:)\s*/i, "").trim() || content;
        await streamMissionMode({
          objective: cleanObjective,
          modelId: selectedModelId,
          attachments,
          signal: abortController.signal,
          onEvent: (event) => {
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== targetConvId) return conv;
                const updatedMessages = conv.messages.map((m) => {
                  if (m.id === assistantMessageId) {
                    const currentMission = m.missionState || initialMission!;
                    let nextMission: MissionState = { ...currentMission };

                    if (event.missionState) {
                      nextMission = event.missionState;
                    } else if (event.type === "phase_change" && event.phase) {
                      nextMission.phase = event.phase;
                    } else if (event.type === "task_started" && event.task) {
                      const idx = nextMission.tasks.findIndex((t) => t.id === event.taskId);
                      if (idx >= 0) nextMission.tasks[idx] = event.task;
                      else nextMission.tasks.push(event.task);
                    } else if (event.type === "task_progress" && event.task) {
                      const idx = nextMission.tasks.findIndex((t) => t.id === event.taskId);
                      if (idx >= 0) nextMission.tasks[idx] = event.task;
                    } else if (event.type === "approval_required" && event.approval) {
                      nextMission.pendingApprovals = [
                        ...(nextMission.pendingApprovals || []).filter((a) => a.id !== event.approval!.id),
                        event.approval,
                      ];
                      nextMission.phase = "approval_gate";
                    }

                    if (event.progress !== undefined) {
                      nextMission.overallProgress = event.progress;
                    }

                    const isDone =
                      nextMission.phase === "completed" ||
                      nextMission.phase === "failed" ||
                      nextMission.phase === "cancelled" ||
                      nextMission.controlState === "completed" ||
                      nextMission.controlState === "failed" ||
                      nextMission.controlState === "cancelled";

                    return {
                      ...m,
                      missionState: nextMission,
                      content: nextMission.finalSynthesis || m.content,
                      isStreaming: !isDone,
                    };
                  }
                  return m;
                });
                return { ...conv, messages: updatedMessages };
              })
            );
            if (settings.autoScroll) scrollToBottom("auto");
          },
        });
      } else if (isOrchestrated) {
        // Multi-Task Orchestration Flow
        await streamTaskOrchestration({
          prompt: content,
          modelId: selectedModelId,
          attachments,
          signal: abortController.signal,
          onPhaseChange: (phase, statusText) => {
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== targetConvId) return conv;
                const updatedMessages = conv.messages.map((m) => {
                  if (m.id === assistantMessageId && m.orchestrationPlan) {
                    return {
                      ...m,
                      orchestrationPlan: {
                        ...m.orchestrationPlan,
                        phase,
                      },
                    };
                  }
                  return m;
                });
                return { ...conv, messages: updatedMessages };
              })
            );
          },
          onPlanCreated: (plan) => {
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== targetConvId) return conv;
                const updatedMessages = conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, orchestrationPlan: plan }
                    : m
                );
                return { ...conv, messages: updatedMessages };
              })
            );
            if (settings.autoScroll) scrollToBottom("auto");
          },
          onSubtaskUpdate: (stepIndex, subtask, artifacts, sources) => {
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== targetConvId) return conv;
                const updatedMessages = conv.messages.map((m) => {
                  if (m.id === assistantMessageId && m.orchestrationPlan) {
                    const nextSubtasks = [...m.orchestrationPlan.subtasks];
                    nextSubtasks[stepIndex] = subtask;
                    return {
                      ...m,
                      groundingSources: sources || m.groundingSources,
                      orchestrationPlan: {
                        ...m.orchestrationPlan,
                        subtasks: nextSubtasks,
                        artifacts: artifacts || m.orchestrationPlan.artifacts,
                      },
                    };
                  }
                  return m;
                });
                return { ...conv, messages: updatedMessages };
              })
            );
            if (settings.autoScroll) scrollToBottom("auto");
          },
          onDone: (plan, finalText, artifacts, sources, modelUsed) => {
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== targetConvId) return conv;
                const updatedMessages = conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: finalText,
                        orchestrationPlan: plan,
                        groundingSources: sources,
                        modelUsed: modelUsed || m.modelUsed,
                        isStreaming: false,
                      }
                    : m
                );
                return { ...conv, messages: updatedMessages };
              })
            );
            if (settings.autoScroll) scrollToBottom("smooth");
          },
        });
      } else {
        // Standard Streaming Chat Flow
        let accumulatedText = "";

        await streamChatMessage({
          messages: fullMessages,
          modelId: selectedModelId,
          systemInstruction,
          temperature: settings.temperature,
          enableWebSearch,
          signal: abortController.signal,
          onChunk: (chunkText) => {
            accumulatedText += chunkText;
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== targetConvId) return conv;
                const updatedMessages = conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: accumulatedText, isStreaming: true }
                    : m
                );
                return { ...conv, messages: updatedMessages };
              })
            );
            if (settings.autoScroll) {
              scrollToBottom("auto");
            }
          },
          onGrounding: (sources) => {
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== targetConvId) return conv;
                const updatedMessages = conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, groundingSources: sources }
                    : m
                );
                return { ...conv, messages: updatedMessages };
              })
            );
          },
        });

        // Mark streaming finished
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== targetConvId) return conv;
            const updatedMessages = conv.messages.map((m) =>
              m.id === assistantMessageId ? { ...m, isStreaming: false } : m
            );
            return { ...conv, messages: updatedMessages };
          })
        );
      }

      // If it was the first turn, generate a smart concise title
      if (isFirstMessage && content.trim()) {
        generateChatTitle(content).then((generatedTitle) => {
          if (generatedTitle) {
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === targetConvId ? { ...conv, title: generatedTitle } : conv
              )
            );
          }
        });
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stream aborted by user");
      } else {
        console.error("Stream generation error:", err);
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== targetConvId) return conv;
            const updatedMessages = conv.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    isStreaming: false,
                    error:
                      err.message || "Failed to generate response. Please try again.",
                  }
                : m
            );
            return { ...conv, messages: updatedMessages };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = async () => {
    if (!activeConversation || isStreaming) return;
    const messages = activeConversation.messages;
    if (messages.length === 0) return;

    // Find the last assistant message
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant") return;

    // Remove last assistant message
    const historyWithoutLast = messages.slice(0, -1);
    const lastUserMsg = historyWithoutLast[historyWithoutLast.length - 1];
    if (!lastUserMsg || lastUserMsg.role !== "user") return;

    const isOrchestrated = shouldOrchestrate(lastUserMsg.content, settings.orchestratorMode || "auto");
    const assistantMessageId = "msg_" + Math.random().toString(36).substring(2, 9);
    const initialPlan: OrchestrationPlan | undefined = isOrchestrated
      ? {
          id: "plan_" + Math.random().toString(36).substring(2, 9),
          userGoal: lastUserMsg.content,
          detectedIntent: "Analyzing multi-task objectives...",
          complexityScore: "high",
          phase: "planning",
          currentStepIndex: 0,
          subtasks: [],
          artifacts: [],
          startedAt: Date.now(),
        }
      : undefined;

    const newAssistantMsg: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      modelUsed: selectedModelId,
      isStreaming: true,
      orchestrationPlan: initialPlan,
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation.id
          ? {
              ...conv,
              messages: [...historyWithoutLast, newAssistantMsg],
            }
          : conv
      )
    );

    setIsStreaming(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const activePersona = PERSONAS.find((p) => p.id === selectedPersonaId);
    const systemInstruction = activePersona?.systemPrompt || "";

    try {
      if (isOrchestrated) {
        await streamTaskOrchestration({
          prompt: lastUserMsg.content,
          modelId: selectedModelId,
          attachments: lastUserMsg.attachments || [],
          signal: abortController.signal,
          onPhaseChange: (phase) => {
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== activeConversation.id) return conv;
                const updatedMessages = conv.messages.map((m) => {
                  if (m.id === assistantMessageId && m.orchestrationPlan) {
                    return {
                      ...m,
                      orchestrationPlan: { ...m.orchestrationPlan, phase },
                    };
                  }
                  return m;
                });
                return { ...conv, messages: updatedMessages };
              })
            );
          },
          onPlanCreated: (plan) => {
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== activeConversation.id) return conv;
                const updatedMessages = conv.messages.map((m) =>
                  m.id === assistantMessageId ? { ...m, orchestrationPlan: plan } : m
                );
                return { ...conv, messages: updatedMessages };
              })
            );
          },
          onSubtaskUpdate: (stepIndex, subtask, artifacts, sources) => {
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== activeConversation.id) return conv;
                const updatedMessages = conv.messages.map((m) => {
                  if (m.id === assistantMessageId && m.orchestrationPlan) {
                    const nextSubtasks = [...m.orchestrationPlan.subtasks];
                    nextSubtasks[stepIndex] = subtask;
                    return {
                      ...m,
                      groundingSources: sources || m.groundingSources,
                      orchestrationPlan: {
                        ...m.orchestrationPlan,
                        subtasks: nextSubtasks,
                        artifacts: artifacts || m.orchestrationPlan.artifacts,
                      },
                    };
                  }
                  return m;
                });
                return { ...conv, messages: updatedMessages };
              })
            );
          },
          onDone: (plan, finalText, artifacts, sources, modelUsed) => {
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== activeConversation.id) return conv;
                const updatedMessages = conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: finalText,
                        orchestrationPlan: plan,
                        groundingSources: sources,
                        modelUsed: modelUsed || m.modelUsed,
                        isStreaming: false,
                      }
                    : m
                );
                return { ...conv, messages: updatedMessages };
              })
            );
          },
        });
      } else {
        let accumulatedText = "";
        await streamChatMessage({
          messages: historyWithoutLast,
          modelId: selectedModelId,
          systemInstruction,
          temperature: settings.temperature,
          enableWebSearch,
          signal: abortController.signal,
          onChunk: (chunk) => {
            accumulatedText += chunk;
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== activeConversation.id) return conv;
                return {
                  ...conv,
                  messages: conv.messages.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: accumulatedText, isStreaming: true }
                      : m
                  ),
                };
              })
            );
            if (settings.autoScroll) scrollToBottom("auto");
          },
          onGrounding: (sources) => {
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== activeConversation.id) return conv;
                return {
                  ...conv,
                  messages: conv.messages.map((m) =>
                    m.id === assistantMessageId ? { ...m, groundingSources: sources } : m
                  ),
                };
              })
            );
          },
        });

        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== activeConversation.id) return conv;
            return {
              ...conv,
              messages: conv.messages.map((m) =>
                m.id === assistantMessageId ? { ...m, isStreaming: false } : m
              ),
            };
          })
        );
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== activeConversation.id) return conv;
            return {
              ...conv,
              messages: conv.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, isStreaming: false, error: err.message }
                  : m
              ),
            };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Edit an existing user message
  const handleEditUserMessage = (msgIndex: number, newContent: string) => {
    if (!activeConversation || isStreaming) return;
    const messages = activeConversation.messages;
    const targetMsg = messages[msgIndex];
    if (!targetMsg || targetMsg.role !== "user") return;

    const isOrchestrated = shouldOrchestrate(newContent, settings.orchestratorMode || "auto");
    const truncatedHistory = messages.slice(0, msgIndex);
    const updatedUserMsg: Message = {
      ...targetMsg,
      content: newContent,
      timestamp: Date.now(),
    };

    const assistantMessageId = "msg_" + Math.random().toString(36).substring(2, 9);
    const initialPlan: OrchestrationPlan | undefined = isOrchestrated
      ? {
          id: "plan_" + Math.random().toString(36).substring(2, 9),
          userGoal: newContent,
          detectedIntent: "Analyzing multi-task objectives...",
          complexityScore: "high",
          phase: "planning",
          currentStepIndex: 0,
          subtasks: [],
          artifacts: [],
          startedAt: Date.now(),
        }
      : undefined;

    const newAssistantMsg: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now() + 1,
      modelUsed: selectedModelId,
      isStreaming: true,
      orchestrationPlan: initialPlan,
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation.id
          ? {
              ...conv,
              messages: [...truncatedHistory, updatedUserMsg, newAssistantMsg],
            }
          : conv
      )
    );

    setIsStreaming(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const activePersona = PERSONAS.find((p) => p.id === selectedPersonaId);
    const systemInstruction = activePersona?.systemPrompt || "";

    const streamHistory = [...truncatedHistory, updatedUserMsg];

    (async () => {
      try {
        if (isOrchestrated) {
          await streamTaskOrchestration({
            prompt: newContent,
            modelId: selectedModelId,
            attachments: updatedUserMsg.attachments || [],
            signal: abortController.signal,
            onPhaseChange: (phase) => {
              setConversations((prev) =>
                prev.map((conv) => {
                  if (conv.id !== activeConversation.id) return conv;
                  const updatedMessages = conv.messages.map((m) => {
                    if (m.id === assistantMessageId && m.orchestrationPlan) {
                      return {
                        ...m,
                        orchestrationPlan: { ...m.orchestrationPlan, phase },
                      };
                    }
                    return m;
                  });
                  return { ...conv, messages: updatedMessages };
                })
              );
            },
            onPlanCreated: (plan) => {
              setConversations((prev) =>
                prev.map((conv) => {
                  if (conv.id !== activeConversation.id) return conv;
                  const updatedMessages = conv.messages.map((m) =>
                    m.id === assistantMessageId ? { ...m, orchestrationPlan: plan } : m
                  );
                  return { ...conv, messages: updatedMessages };
                })
              );
            },
            onSubtaskUpdate: (stepIndex, subtask, artifacts, sources) => {
              setConversations((prev) =>
                prev.map((conv) => {
                  if (conv.id !== activeConversation.id) return conv;
                  const updatedMessages = conv.messages.map((m) => {
                    if (m.id === assistantMessageId && m.orchestrationPlan) {
                      const nextSubtasks = [...m.orchestrationPlan.subtasks];
                      nextSubtasks[stepIndex] = subtask;
                      return {
                        ...m,
                        groundingSources: sources || m.groundingSources,
                        orchestrationPlan: {
                          ...m.orchestrationPlan,
                          subtasks: nextSubtasks,
                          artifacts: artifacts || m.orchestrationPlan.artifacts,
                        },
                      };
                    }
                    return m;
                  });
                  return { ...conv, messages: updatedMessages };
                })
              );
            },
            onDone: (plan, finalText, artifacts, sources, modelUsed) => {
              setConversations((prev) =>
                prev.map((conv) => {
                  if (conv.id !== activeConversation.id) return conv;
                  const updatedMessages = conv.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: finalText,
                          orchestrationPlan: plan,
                          groundingSources: sources,
                          modelUsed: modelUsed || m.modelUsed,
                          isStreaming: false,
                        }
                      : m
                  );
                  return { ...conv, messages: updatedMessages };
                })
              );
            },
          });
        } else {
          let accumulatedText = "";
          await streamChatMessage({
            messages: streamHistory,
            modelId: selectedModelId,
            systemInstruction,
            temperature: settings.temperature,
            enableWebSearch,
            signal: abortController.signal,
            onChunk: (chunk) => {
              accumulatedText += chunk;
              setConversations((prev) =>
                prev.map((conv) => {
                  if (conv.id !== activeConversation.id) return conv;
                  return {
                    ...conv,
                    messages: conv.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: accumulatedText, isStreaming: true }
                        : m
                    ),
                  };
                })
              );
              if (settings.autoScroll) scrollToBottom("auto");
            },
          });

          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id !== activeConversation.id) return conv;
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantMessageId ? { ...m, isStreaming: false } : m
                ),
              };
            })
          );
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id !== activeConversation.id) return conv;
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, isStreaming: false, error: err.message }
                    : m
                ),
              };
            })
          );
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    })();
  };

  // Delete single conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  };

  // Rename conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  // Toggle Pin
  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  // Clear current active messages
  const handleClearCurrentChat = () => {
    if (!activeId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, messages: [] } : c))
    );
  };

  // Update mission state on message (from pause/resume/approve actions)
  const handleMissionUpdate = (msgId: string, updatedMission: MissionState) => {
    if (!activeId) return;
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeId) return conv;
        return {
          ...conv,
          messages: conv.messages.map((m) => {
            if (m.id !== msgId) return m;
            return {
              ...m,
              missionState: updatedMission,
              content: updatedMission.finalSynthesis || m.content,
            };
          }),
        };
      })
    );
  };

  // Reaction on message
  const handleReaction = (msgId: string, type: "liked" | "disliked") => {
    if (!activeId) return;
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeId) return conv;
        return {
          ...conv,
          messages: conv.messages.map((m) => {
            if (m.id !== msgId) return m;
            const currentLiked = m.reactions?.liked;
            const currentDisliked = m.reactions?.disliked;
            return {
              ...m,
              reactions: {
                liked: type === "liked" ? !currentLiked : false,
                disliked: type === "disliked" ? !currentDisliked : false,
              },
            };
          }),
        };
      })
    );
  };

  const hasMessages = Boolean(activeConversation && activeConversation.messages.length > 0);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          setActiveId(id);
          const found = conversations.find((c) => c.id === id);
          if (found) {
            setSelectedModelId(found.modelId || settings.defaultModelId);
            if (found.personaId) setSelectedPersonaId(found.personaId);
            if (found.enableWebSearch !== undefined) setEnableWebSearch(found.enableWebSearch);
          }
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePin}
        onExportConversation={(conv) => {
          setIsExportOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenRegistry={() => setIsRegistryOpen(true)}
        onOpenMemory={() => setIsMemoryOpen(true)}
        user={user}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onNavigateToView={(view) => setCurrentView(view)}
        currentView={currentView}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-white dark:bg-slate-950">
        {/* Header Bar */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          models={models}
          selectedModelId={selectedModelId}
          onSelectModel={(id) => setSelectedModelId(id)}
          personas={PERSONAS}
          selectedPersonaId={selectedPersonaId}
          onSelectPersona={(id) => setSelectedPersonaId(id)}
          enableWebSearch={enableWebSearch}
          onToggleWebSearch={() => setEnableWebSearch(!enableWebSearch)}
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
          user={user}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenRegistry={() => setIsRegistryOpen(true)}
          onOpenMemory={() => setIsMemoryOpen(true)}
          onOpenResumeStudio={() => setIsResumeStudioOpen(true)}
          onOpenImageStudio={() => setIsImageStudioOpen(true)}
          onClearChat={handleClearCurrentChat}
          onNewChat={handleNewChat}
          hasMessages={hasMessages}
        />

        {/* Workspace Navigation Bar */}
        <WorkspaceNav
          currentView={currentView}
          onSelectView={(view) => {
            if (view === "settings") {
              setIsSettingsOpen(true);
            } else {
              setCurrentView(view);
            }
          }}
          activeProject={activeProject}
          projects={projects}
          onSelectProject={handleSelectProject}
          onOpenNewProject={() => setCurrentView("projects")}
          activeMissionsCount={activeProject?.missions?.filter((m) => m.controlState === "running" || m.controlState === "awaiting_approval").length || 0}
          filesCount={activeProject?.files?.length || 0}
          artifactsCount={activeProject?.artifacts?.length || 0}
          memoriesCount={activeProject?.memories?.length || 0}
        />

        {/* Dynamic Workspace Views */}
        {currentView === "chat" && (
          <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
            {/* Chat Scroll Container */}
            <div
              ref={chatScrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
              id="chat-scroll-container"
            >
              {!hasMessages ? (
                <WelcomeScreen
                  onSelectPrompt={(promptText) => handleSendMessage(promptText)}
                  activeModelName={models.find((m) => m.id === selectedModelId)?.name}
                />
              ) : (
                <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 flex-1">
                  {activeConversation?.messages.map((message, idx) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      isLast={idx === activeConversation.messages.length - 1}
                      onRegenerate={idx === activeConversation.messages.length - 1 ? handleRegenerate : undefined}
                      onEditMessage={(newContent) => handleEditUserMessage(idx, newContent)}
                      onReaction={(type) => handleReaction(message.id, type)}
                      onPreviewArtifact={(art) => setPreviewArtifact(art)}
                      onMissionUpdate={(updated) => handleMissionUpdate(message.id, updated)}
                    />
                  ))}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>

            {/* Scroll to Bottom Floating Action */}
            {showScrollBottom && (
              <button
                onClick={() => scrollToBottom("smooth")}
                className="absolute bottom-28 right-6 z-20 p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xl hover:scale-105 transition-transform"
                title="Scroll to bottom"
                id="btn-scroll-bottom"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            )}

            {/* Input Composer Bar */}
            <InputBar
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
              enableWebSearch={enableWebSearch}
              onToggleWebSearch={() => setEnableWebSearch(!enableWebSearch)}
              orchestratorMode={settings.orchestratorMode || "auto"}
              onToggleOrchestratorMode={() => {
                const nextMode =
                  settings.orchestratorMode === "auto" || !settings.orchestratorMode
                    ? "always"
                    : settings.orchestratorMode === "always"
                    ? "off"
                    : "auto";
                setSettings((prev) => ({ ...prev, orchestratorMode: nextMode }));
              }}
            />
          </div>
        )}

        {currentView === "missions" && (
          <MissionsView
            project={activeProject}
            activeMission={activeMission}
            onSelectMission={(m) => setActiveMission(m)}
            onLaunchMission={handleLaunchMissionFromDashboard}
            onMissionUpdate={(m) => setActiveMission(m)}
            onPreviewArtifact={(art) => setPreviewArtifact(art)}
          />
        )}

        {currentView === "projects" && (
          <ProjectsView
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onNavigateToView={(view) => setCurrentView(view)}
          />
        )}

        {currentView === "files" && (
          <FilesView
            project={activeProject}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
            onAttachFileToChat={handleAttachFileToChat}
            onAttachToChat={handleAttachFileToChat}
            onLaunchMissionWithFile={handleLaunchMissionWithFile}
          />
        )}

        {currentView === "agents" && <AgentsView />}

        {currentView === "artifacts" && (
          <ArtifactsView
            project={activeProject}
            allProjects={projects}
            onPreviewArtifact={(art) => setPreviewArtifact(art)}
          />
        )}

        {currentView === "memory" && <MemoryView project={activeProject} />}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        models={models}
        personas={PERSONAS}
        conversations={conversations}
        onImportConversations={(imported) => {
          setConversations((prev) => [...imported, ...prev]);
          if (imported.length > 0) setActiveId(imported[0].id);
        }}
        onClearAllConversations={() => {
          setConversations([]);
          setActiveId(null);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onUpdateUser={setUser}
      />

      {/* Export / Share Modal */}
      <ExportShareModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        conversation={activeConversation}
      />

      {/* Artifact Fullscreen & Interactive Previewer */}
      <ArtifactViewerModal
        artifact={previewArtifact}
        onClose={() => setPreviewArtifact(null)}
      />

      {/* Agent & Tool Registry Modal */}
      <AgentRegistryModal
        isOpen={isRegistryOpen}
        onClose={() => setIsRegistryOpen(false)}
      />

      {/* Memory & Context Engine Modal */}
      <MemoryManagerModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />

      {/* Professional Resume & Document Studio Modal */}
      <ResumeBuilderModal
        isOpen={isResumeStudioOpen}
        onClose={() => setIsResumeStudioOpen(false)}
        onGenerateResume={(prompt) => handleSendMessage(prompt, [])}
      />

      {/* Free AI Image Generation & Editing Studio Modal */}
      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        onSendToChat={(dataUrl, promptText) => {
          handleSendMessage(promptText, [
            {
              id: Date.now().toString(),
              name: "ai_studio_image.png",
              type: "image",
              mimeType: "image/png",
              size: dataUrl.length,
              data: dataUrl,
            },
          ]);
        }}
      />
    </div>
  );
}
