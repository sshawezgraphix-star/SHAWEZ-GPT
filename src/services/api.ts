import {
  AgentRegistryItem,
  AIModel,
  Attachment,
  GeneratedArtifact,
  GroundingSource,
  Message,
  MissionControlActionRequest,
  MissionEventPayload,
  MissionState,
  MissionTestReport,
  OrchestrationPlan,
  OrchestratorPhase,
  OrchestratorSubtask,
  RegistryHealthReport,
  RegistryTestReport,
  ToolRegistryItem,
  ProviderPoolStatus,
} from "../types";
import { generateProfessionalPDF } from "./pdfGenerator";
import { streamDirectGemini } from "./directGemini";
import { streamUnifiedAI } from "./freeRouter";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("shawezgpt_backend_url");
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, "");
    }
  }
  return "";
}

export function setCustomBackendUrl(url: string): void {
  if (typeof window !== "undefined") {
    if (!url || !url.trim()) {
      localStorage.removeItem("shawezgpt_backend_url");
    } else {
      localStorage.setItem("shawezgpt_backend_url", url.trim().replace(/\/+$/, ""));
    }
  }
}

export function getCustomBackendUrl(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("shawezgpt_backend_url") || "";
  }
  return "";
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

export interface StreamChatParams {
  messages: Message[];
  modelId?: string;
  systemInstruction?: string;
  temperature?: number;
  enableWebSearch?: boolean;
  onChunk: (text: string) => void;
  onGrounding?: (sources: GroundingSource[]) => void;
  signal?: AbortSignal;
}

export interface StreamOrchestratorParams {
  prompt: string;
  modelId?: string;
  attachments?: Attachment[];
  onPhaseChange?: (phase: OrchestratorPhase, statusText: string) => void;
  onPlanCreated?: (plan: OrchestrationPlan) => void;
  onSubtaskUpdate?: (
    stepIndex: number,
    subtask: OrchestratorSubtask,
    artifacts?: GeneratedArtifact[],
    sources?: GroundingSource[]
  ) => void;
  onDone?: (
    plan: OrchestrationPlan,
    finalText: string,
    artifacts: GeneratedArtifact[],
    sources: GroundingSource[],
    modelUsed?: string
  ) => void;
  signal?: AbortSignal;
}

function cleanErrorMessage(msg: any): string {
  if (!msg) return "An unexpected error occurred.";
  let str = typeof msg === "string" ? msg : JSON.stringify(msg);
  try {
    const parsed = JSON.parse(str);
    if (parsed.error?.message) str = parsed.error.message;
    else if (parsed.message) str = parsed.message;
  } catch {}
  if (typeof str === "string" && str.includes('"message":')) {
    const match = str.match(/"message":\s*"([^"]+)"/);
    if (match && match[1]) str = match[1];
  }
  if (str.includes("503") || str.includes("high demand") || str.includes("UNAVAILABLE")) {
    return "This AI model is temporarily experiencing high server demand. Please try again in a moment or switch to Shawez Ultra Lite.";
  }
  if (str.includes("429") || str.includes("RESOURCE_EXHAUSTED")) {
    return "Rate limit reached. Please wait a moment before sending another message.";
  }
  return str;
}

/**
 * Checks whether a message should trigger the Multi-Task Task Orchestrator.
 */
export function shouldOrchestrate(prompt: string, mode: "auto" | "always" | "off" = "auto"): boolean {
  if (mode === "off") return false;
  if (mode === "always") return true;
  if (!prompt) return false;

  const lower = prompt.toLowerCase();
  const keywords = [
    "pdf",
    "report and",
    "research and",
    "research this topic",
    "turn it into a professional pdf",
    "give me the final file",
    "analyze and debug",
    "write tests and",
    "subtask",
    "orchestrat",
    "create a report",
    "generate a pdf",
    "build a website and",
    "generate a ui and",
    "first,",
    "then,",
    "finally,",
    "step by step",
  ];

  if (keywords.some((k) => lower.includes(k))) return true;
  if (lower.includes("pdf") && (lower.includes("research") || lower.includes("report") || lower.includes("create"))) return true;
  if (lower.includes("debug") && (lower.includes("fix") || lower.includes("test"))) return true;

  return false;
}

export async function streamChatMessage({
  messages,
  modelId,
  systemInstruction,
  temperature = 0.7,
  enableWebSearch = false,
  onChunk,
  onGrounding,
  signal,
}: StreamChatParams): Promise<{ fullText: string; sources: GroundingSource[] }> {
  // Format payload for server
  const payload = {
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments?.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        mimeType: a.mimeType,
        size: a.size,
        data: a.data,
        textContent: a.textContent,
      })),
    })),
    model: modelId,
    systemInstruction,
    temperature,
    enableWebSearch,
  };

  // If no custom remote backend URL is set, run standalone direct Unified AI engine immediately
  const customBackend = getCustomBackendUrl();
  if (!customBackend) {
    return await streamUnifiedAI({
      messages,
      modelId,
      systemInstruction,
      temperature,
      enableWebSearch,
      onChunk,
      onGrounding,
      signal,
    });
  }

  try {
    const response = await fetch(buildApiUrl("/api/chat/stream"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      console.warn("[API] Custom backend server error, falling back to Unified AI engine...");
      return await streamUnifiedAI({
        messages,
        modelId,
        systemInstruction,
        temperature,
        enableWebSearch,
        onChunk,
        onGrounding,
        signal,
      });
    }

    if (!response.body) {
      throw new Error("No readable stream received from server.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullText = "";
    let sources: GroundingSource[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "message";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith("event:")) {
          currentEvent = line.substring(6).trim();
        } else if (line.startsWith("data:")) {
          const rawData = line.substring(5).trim();
          try {
            const data = JSON.parse(rawData);

            if (currentEvent === "chunk") {
              if (data.text) {
                fullText += data.text;
                onChunk(data.text);
              }
            } else if (currentEvent === "grounding") {
              if (data.sources && Array.isArray(data.sources)) {
                sources = data.sources;
                onGrounding?.(sources);
              }
            } else if (currentEvent === "error") {
              throw new Error(cleanErrorMessage(data.message || "An error occurred while streaming AI response."));
            } else if (currentEvent === "done") {
              if (data.sources && Array.isArray(data.sources)) {
                sources = data.sources;
              }
            }
          } catch (e: any) {
            if (e.message && e.message.includes("An error occurred")) {
              throw e;
            }
          }
        }
      }
    }

      return { fullText, sources };
    } catch (streamErr: any) {
      if (signal?.aborted) {
        return { fullText, sources };
      }
      throw streamErr;
    } finally {
      reader.releaseLock();
    }
  } catch (outerErr: any) {
    if (signal?.aborted) {
      return { fullText: "", sources: [] };
    }
    console.warn("[API] Backend server unavailable or threw error, using direct client-side Gemini fallback:", outerErr?.message);
    return await streamDirectGemini({
      messages,
      modelId,
      systemInstruction,
      temperature,
      enableWebSearch,
      onChunk,
      onGrounding,
      signal,
    });
  }
}

/**
 * Streams the Multi-Task Task Orchestrator pipeline from `/api/orchestrator/stream`.
 */
export async function streamTaskOrchestration({
  prompt,
  modelId,
  attachments = [],
  onPhaseChange,
  onPlanCreated,
  onSubtaskUpdate,
  onDone,
  signal,
}: StreamOrchestratorParams): Promise<void> {
  const payload = {
    prompt,
    model: modelId,
    attachments: attachments.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      mimeType: a.mimeType,
      size: a.size,
      data: a.data,
      textContent: a.textContent,
    })),
  };

  const response = await fetch(buildApiUrl("/api/orchestrator/stream"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let errBody: any = null;
    try {
      errBody = await response.json();
    } catch {}
    const msg = cleanErrorMessage(errBody?.message || errBody?.error || `Orchestrator failed with status ${response.status}`);
    throw new Error(msg);
  }

  if (!response.body) {
    throw new Error("No readable stream received from orchestrator.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let activePlan: OrchestrationPlan | null = null;
  let finalResponseText = "";
  let finalArtifacts: GeneratedArtifact[] = [];
  let finalSources: GroundingSource[] = [];
  let modelUsed = modelId || "gemini-3.7-flash";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "message";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith("event:")) {
          currentEvent = line.substring(6).trim();
        } else if (line.startsWith("data:")) {
          const rawData = line.substring(5).trim();
          try {
            const data = JSON.parse(rawData);

            if (currentEvent === "phase_change") {
              onPhaseChange?.(data.phase, data.statusText);
            } else if (currentEvent === "plan_created") {
              activePlan = data.plan;
              onPlanCreated?.(data.plan);
            } else if (currentEvent === "subtask_update") {
              if (data.artifacts && Array.isArray(data.artifacts)) {
                finalArtifacts = data.artifacts;
              }
              if (data.sources && Array.isArray(data.sources)) {
                finalSources = data.sources;
              }
              onSubtaskUpdate?.(data.stepIndex, data.subtask, data.artifacts, data.sources);
            } else if (currentEvent === "orchestration_done") {
              activePlan = data.plan;
              finalResponseText = data.finalText || "";
              finalArtifacts = data.artifacts || [];
              finalSources = data.sources || [];
              modelUsed = data.modelUsed || modelUsed;

              // Generate real client-side PDF dataUrl if PDF artifact exists
              const pdfArtifact = finalArtifacts.find((a) => a.type === "pdf");
              if (pdfArtifact && !pdfArtifact.dataUrl && pdfArtifact.textContent) {
                try {
                  const pdfResult = generateProfessionalPDF({
                    title: pdfArtifact.title || "ShawezGPT Intelligence Report",
                    subtitle: `Generated for: ${prompt.slice(0, 50)}...`,
                    executiveSummary: activePlan?.detectedIntent || "Comprehensive multi-task analysis and verified deliverable.",
                    sections: [
                      {
                        title: "Executive Synthesis & Deliverable",
                        content: pdfArtifact.textContent.slice(0, 4000),
                      },
                    ],
                  });
                  if (pdfResult.success && pdfResult.dataUrl) {
                    pdfArtifact.dataUrl = pdfResult.dataUrl;
                    pdfArtifact.filename = pdfResult.filename;
                    pdfArtifact.verified = true;
                  }
                } catch (pdfErr) {
                  console.warn("Client PDF post-render notice:", pdfErr);
                }
              }

              onDone?.(activePlan!, finalResponseText, finalArtifacts, finalSources, modelUsed);
            } else if (currentEvent === "error") {
              throw new Error(cleanErrorMessage(data.message || "An error occurred during task orchestration."));
            }
          } catch (e: any) {
            if (e.message && e.message.includes("An error occurred")) {
              throw e;
            }
          }
        }
      }
    }
  } catch (err: any) {
    if (signal?.aborted) {
      return;
    }
    throw err;
  } finally {
    reader.releaseLock();
  }
}

export async function fetchAvailableModels(): Promise<AIModel[]> {
  try {
    const res = await fetch(buildApiUrl("/api/models"));
    if (!res.ok) throw new Error("Failed to fetch models");
    const data = await res.json();
    return data.models;
  } catch (err) {
    console.warn("Could not fetch remote models, falling back to local constants:", err);
    const { DEFAULT_MODELS } = await import("../data/models");
    return DEFAULT_MODELS;
  }
}

export async function generateChatTitle(prompt: string): Promise<string> {
  try {
    const res = await fetch(buildApiUrl("/api/chat/title"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return prompt.slice(0, 24);
    const data = await res.json();
    return data.title || prompt.slice(0, 24);
  } catch {
    return prompt.slice(0, 24);
  }
}

export async function verifyLogin(name: string, email: string) {
  const res = await fetch(buildApiUrl("/api/auth/demo-login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) throw new Error("Authentication failed");
  return res.json();
}

export async function checkServerHealth(): Promise<{
  status: string;
  appName: string;
  defaultModel: string;
  apiKeyConfigured: boolean;
  geminiKeyCount?: number;
  geminiHealthyKeys?: number;
  ollamaConnected?: boolean;
  ollamaModelCount?: number;
}> {
  try {
    const res = await fetch(buildApiUrl("/api/health"));
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch {
    return {
      status: "offline",
      appName: "ShawezGPT",
      defaultModel: "gemini-3.7-flash",
      apiKeyConfigured: false,
    };
  }
}

export async function fetchProviderPoolStatus(): Promise<ProviderPoolStatus | null> {
  try {
    const res = await fetch(buildApiUrl("/api/providers/status"));
    if (!res.ok) throw new Error("Failed to fetch providers status");
    return await res.json();
  } catch (err) {
    console.error("Error fetching provider status:", err);
    return null;
  }
}

export async function fetchOllamaStatus(): Promise<any> {
  try {
    const res = await fetch(buildApiUrl("/api/ollama/status"));
    if (!res.ok) throw new Error("Failed to fetch ollama status");
    return await res.json();
  } catch (err) {
    return { isConnected: false, models: [], error: "Not reachable" };
  }
}

export async function updateOllamaConfigApi(baseUrl: string): Promise<any> {
  try {
    const res = await fetch(buildApiUrl("/api/ollama/config"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseUrl }),
    });
    if (!res.ok) throw new Error("Failed to update Ollama config");
    return await res.json();
  } catch (err: any) {
    return { isConnected: false, models: [], error: err.message || "Failed to connect to Ollama" };
  }
}

export async function fetchRegisteredAgents(): Promise<AgentRegistryItem[]> {
  try {
    const res = await fetch(buildApiUrl("/api/registry/agents"));
    if (!res.ok) throw new Error("Failed to fetch agents");
    const data = await res.json();
    return data.agents || [];
  } catch (err) {
    console.error("Error fetching agents:", err);
    return [];
  }
}

export async function fetchRegisteredTools(): Promise<ToolRegistryItem[]> {
  try {
    const res = await fetch(buildApiUrl("/api/registry/tools"));
    if (!res.ok) throw new Error("Failed to fetch tools");
    const data = await res.json();
    return data.tools || [];
  } catch (err) {
    console.error("Error fetching tools:", err);
    return [];
  }
}

export async function fetchRegistryHealth(): Promise<RegistryHealthReport | null> {
  try {
    const res = await fetch(buildApiUrl("/api/registry/health"));
    if (!res.ok) throw new Error("Failed to fetch registry health");
    return await res.json();
  } catch (err) {
    console.error("Error fetching registry health:", err);
    return null;
  }
}

export async function updateAgentStatusApi(
  agentId: string,
  status: "active" | "degraded" | "inactive" | "maintenance"
): Promise<boolean> {
  try {
    const res = await fetch(buildApiUrl(`/api/registry/agents/${encodeURIComponent(agentId)}/status`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (err) {
    console.error("Error updating agent status:", err);
    return false;
  }
}

export async function runRegistryTestsApi(): Promise<RegistryTestReport | null> {
  try {
    const res = await fetch(buildApiUrl("/api/registry/run-tests"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to run test suite");
    return await res.json();
  } catch (err) {
    console.error("Error running test suite:", err);
    return null;
  }
}

// ==========================================
// MEMORY & CONTEXT ENGINE CLIENT API
// ==========================================

import {
  ContextAssembly,
  MemoryEntry,
  MemoryStats,
  MemoryTestReport,
} from "../types";

export async function fetchMemoriesApi(params?: {
  query?: string;
  projectId?: string;
  type?: string;
  privacy?: string;
  approvalStatus?: string;
  includePending?: boolean;
  limit?: number;
}): Promise<MemoryEntry[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.append("query", params.query);
    if (params?.projectId) searchParams.append("projectId", params.projectId);
    if (params?.type) searchParams.append("type", params.type);
    if (params?.privacy) searchParams.append("privacy", params.privacy);
    if (params?.approvalStatus) searchParams.append("approvalStatus", params.approvalStatus);
    if (params?.includePending !== undefined) {
      searchParams.append("includePending", String(params.includePending));
    }
    if (params?.limit) searchParams.append("limit", String(params.limit));

    const res = await fetch(buildApiUrl(`/api/memory?${searchParams.toString()}`));
    if (!res.ok) throw new Error("Failed to fetch memories");
    const data = await res.json();
    return data.memories || [];
  } catch (err) {
    console.error("Error fetching memories:", err);
    return [];
  }
}

export async function fetchMemoryStatsApi(): Promise<{
  stats: MemoryStats;
  health: { status: string; sanitizerWorking: boolean; latencyMs: number };
} | null> {
  try {
    const res = await fetch(buildApiUrl("/api/memory/stats"));
    if (!res.ok) throw new Error("Failed to fetch memory stats");
    return await res.json();
  } catch (err) {
    console.error("Error fetching memory stats:", err);
    return null;
  }
}

export async function createMemoryApi(payload: {
  type?: string;
  title: string;
  content: string;
  summary?: string;
  projectId?: string;
  sessionId?: string;
  tags?: string[];
  importance?: number;
  privacy?: string;
  approvalStatus?: string;
  warnings?: string[];
}): Promise<{
  success: boolean;
  entry?: MemoryEntry;
  wasRedacted?: boolean;
  warnings?: string[];
  error?: string;
}> {
  try {
    const res = await fetch(buildApiUrl("/api/memory"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create memory");
    return data;
  } catch (err: any) {
    console.error("Error creating memory:", err);
    return { success: false, error: err?.message || "Failed to create memory" };
  }
}

export async function updateMemoryApi(
  id: string,
  patch: Partial<MemoryEntry>
): Promise<{
  success: boolean;
  entry?: MemoryEntry;
  wasRedacted?: boolean;
  warnings?: string[];
  error?: string;
}> {
  try {
    const res = await fetch(buildApiUrl(`/api/memory/${encodeURIComponent(id)}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update memory");
    return data;
  } catch (err: any) {
    console.error("Error updating memory:", err);
    return { success: false, error: err?.message || "Failed to update memory" };
  }
}

export async function deleteMemoryApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(buildApiUrl(`/api/memory/${encodeURIComponent(id)}`), {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.error("Error deleting memory:", err);
    return false;
  }
}

export async function approveMemoryApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(buildApiUrl(`/api/memory/${encodeURIComponent(id)}/approve`), {
      method: "POST",
    });
    return res.ok;
  } catch (err) {
    console.error("Error approving memory:", err);
    return false;
  }
}

export async function rejectMemoryApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(buildApiUrl(`/api/memory/${encodeURIComponent(id)}/reject`), {
      method: "POST",
    });
    return res.ok;
  } catch (err) {
    console.error("Error rejecting memory:", err);
    return false;
  }
}

export async function simulateContextRetrievalApi(
  query: string,
  projectId: string = "shawezgpt-main",
  maxTokens: number = 1200
): Promise<ContextAssembly | null> {
  try {
    const res = await fetch(buildApiUrl("/api/memory/retrieve"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, projectId, maxTokens }),
    });
    if (!res.ok) throw new Error("Failed to simulate context retrieval");
    return await res.json();
  } catch (err) {
    console.error("Error simulating context retrieval:", err);
    return null;
  }
}

export async function runMemoryTestsApi(): Promise<MemoryTestReport | null> {
  try {
    const res = await fetch(buildApiUrl("/api/memory/run-tests"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to run memory test suite");
    return await res.json();
  } catch (err) {
    console.error("Error running memory test suite:", err);
    return null;
  }
}

// ==========================================
// AUTONOMOUS MISSION MODE CLIENT API
// ==========================================

export interface StreamMissionParams {
  objective: string;
  modelId?: string;
  attachments?: Attachment[];
  onEvent?: (event: MissionEventPayload) => void;
  signal?: AbortSignal;
}

export async function streamMissionMode({
  objective,
  modelId,
  attachments = [],
  onEvent,
  signal,
}: StreamMissionParams): Promise<void> {
  const payload = {
    objective,
    model: modelId,
    attachments: attachments.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      mimeType: a.mimeType,
      size: a.size,
      data: a.data,
      textContent: a.textContent,
    })),
  };

  const response = await fetch(buildApiUrl("/api/mission/stream"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let errBody: any = null;
    try {
      errBody = await response.json();
    } catch {}
    const msg = cleanErrorMessage(errBody?.message || errBody?.error || `Mission failed with status ${response.status}`);
    throw new Error(msg);
  }

  if (!response.body) {
    throw new Error("No readable stream received from mission engine.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "message";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith("event:")) {
          currentEvent = line.substring(6).trim();
        } else if (line.startsWith("data:")) {
          const rawData = line.substring(5).trim();
          try {
            const data = JSON.parse(rawData);
            if (currentEvent === "error") {
              throw new Error(cleanErrorMessage(data.message || "An error occurred during mission execution."));
            }
            onEvent?.(data as MissionEventPayload);
          } catch (e: any) {
            if (e.message && e.message.includes("An error occurred")) {
              throw e;
            }
          }
        }
      }
    }
  } catch (err: any) {
    if (signal?.aborted) {
      return;
    }
    throw err;
  } finally {
    reader.releaseLock();
  }
}

export async function sendMissionControlAction(
  missionId: string,
  action: "pause" | "resume" | "cancel" | "retry" | "approve" | "reject",
  extra: { taskId?: string; approvalId?: string; decisionReason?: string } = {}
): Promise<{ success: boolean; mission?: MissionState; error?: string }> {
  try {
    const res = await fetch(buildApiUrl(`/api/mission/${encodeURIComponent(missionId)}/control`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || "Failed to execute mission control action" };
    }
    return await res.json();
  } catch (err: any) {
    console.error("Error sending mission control action:", err);
    return { success: false, error: err.message || "Network error" };
  }
}

export async function runMissionTestsApi(): Promise<MissionTestReport | null> {
  try {
    const res = await fetch(buildApiUrl("/api/mission/run-tests"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to run mission test suite");
    return await res.json();
  } catch (err) {
    console.error("Error running mission test suite:", err);
    return null;
  }
}
