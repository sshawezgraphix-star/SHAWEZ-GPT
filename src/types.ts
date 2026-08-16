export interface Attachment {
  id: string;
  name: string;
  type: "image" | "document" | "code" | "data";
  mimeType?: string;
  size: number;
  data?: string; // base64 representation for images
  textContent?: string; // raw content for code/text/markdown/json files
  previewUrl?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

// 11 Supported Orchestrator Capabilities
export type OrchestratorCapability =
  | "coding"
  | "code_analysis_debugging"
  | "research"
  | "web_search"
  | "file_analysis"
  | "pdf_doc_generation"
  | "data_analysis"
  | "writing"
  | "ui_website_generation"
  | "image_understanding"
  | "general_ai";

export interface OrchestratorCapabilityInfo {
  id: OrchestratorCapability;
  name: string;
  description: string;
  iconName: string;
  badgeColor: string;
}

export type SubtaskStatus = "pending" | "running" | "verifying" | "completed" | "failed";

export interface VerificationResult {
  verified: boolean;
  details: string;
  checksPassed: string[];
  timestamp?: number;
}

export interface OrchestratorSubtask {
  id: string;
  title: string;
  description: string;
  capability: OrchestratorCapability;
  status: SubtaskStatus;
  dependsOn?: string[];
  output?: string;
  verificationResult?: VerificationResult;
  durationMs?: number;
  error?: string;
  logs?: string[];
  assignedAgentId?: string;
  assignedAgentName?: string;
  selectedTools?: string[];
  routingConfidence?: number;
}

export interface AgentRegistryItem {
  id: string;
  name: string;
  purpose: string;
  version: string;
  capabilities: OrchestratorCapability[];
  supportedCapabilities?: OrchestratorCapability[];
  tools: string[];
  permissions?: string[];
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  status: "active" | "healthy" | "degraded" | "inactive" | "maintenance";
  metrics?: {
    totalInvocations: number;
    successfulInvocations: number;
    failedInvocations: number;
    averageLatencyMs: number;
    lastExecutedAt?: number;
  };
  averageLatencyMs?: number;
  successRate?: number;
  totalExecutions?: number;
}

export interface ToolRegistryItem {
  id: string;
  name: string;
  description: string;
  category: "search" | "generation" | "analysis" | "validation" | "utility" | "system" | "security";
  version?: string;
  permissions?: string[];
  parameters?: any;
  returns?: Record<string, any>;
  status?: "available" | "degraded" | "unavailable";
  isBuiltin?: boolean;
  metrics?: {
    totalCalls: number;
    successCalls: number;
    failureCalls: number;
    avgExecutionTimeMs: number;
    lastExecutedAt?: number;
  };
}

export interface RegistryHealthReport {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  totalAgents: number;
  activeAgents: number;
  totalTools: number;
  availableTools: number;
  agentHealth: Record<string, { healthy: boolean; status: string; latencyMs: number; details?: string; lastChecked: string }>;
  toolHealth: Record<string, { healthy: boolean; status: string; latencyMs: number; details?: string; lastChecked: string }>;
}

export interface RegistryTestReport {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: Array<{
    testName: string;
    passed: boolean;
    durationMs: number;
    error?: string;
    details?: any;
  }>;
}

// Memory & Context Engine Types
export type MemoryType =
  | "short_term_conversation"
  | "long_term_user"
  | "project_specific"
  | "file_project_context"
  | "decision_record"
  | "user_preference";

export type MemoryPrivacy = "public" | "project_only" | "private";
export type MemoryApprovalStatus = "approved" | "pending" | "rejected";
export type MemorySource = "user" | "auto_extracted" | "system" | "orchestrator";

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  summary?: string;
  projectId?: string;
  sessionId?: string;
  tags: string[];
  importance: number; // 1 to 5
  privacy: MemoryPrivacy;
  approvalStatus: MemoryApprovalStatus;
  source: MemorySource;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt?: number;
  accessCount: number;
  tokenCountEstimate: number;
  metadata?: Record<string, any>;
}

export interface MemoryQuery {
  query: string;
  projectId?: string;
  sessionId?: string;
  types?: MemoryType[];
  tags?: string[];
  privacyFilter?: MemoryPrivacy[];
  approvalStatus?: MemoryApprovalStatus;
  limit?: number;
  minRelevance?: number;
  includePending?: boolean;
}

export interface MemoryRetrievalResult {
  entry: MemoryEntry;
  score: number;
  matchReason: string;
}

export interface ContextAssembly {
  query: string;
  projectId?: string;
  shortTermContext: string;
  longTermContext: string;
  projectContext: string;
  decisionsContext: string;
  preferencesContext: string;
  combinedContext: string;
  totalTokensEstimate: number;
  retrievedMemories: MemoryRetrievalResult[];
  summarizedCount: number;
  warnings?: string[];
}

export interface MemoryStats {
  totalMemories: number;
  approvedMemories: number;
  pendingMemories: number;
  byType: Record<MemoryType, number>;
  byProject: Record<string, number>;
  totalEstimatedTokens: number;
  sanitizedCount: number;
}

export interface MemoryTestReport {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: Array<{
    testName: string;
    passed: boolean;
    durationMs: number;
    error?: string;
    details?: any;
  }>;
}

export type OrchestratorPhase =
  | "planning"
  | "researching"
  | "creating"
  | "verifying"
  | "completed"
  | "failed";

export interface GeneratedArtifact {
  id: string;
  type: "pdf" | "ui_preview" | "code_file" | "data_table" | "report";
  title: string;
  filename?: string;
  dataUrl?: string;
  textContent?: string;
  previewHtml?: string;
  metadata?: Record<string, any>;
  verified?: boolean;
}

export interface OrchestrationPlan {
  id: string;
  userGoal: string;
  detectedIntent: string;
  complexityScore: "low" | "medium" | "high";
  phase: OrchestratorPhase;
  currentStepIndex: number;
  subtasks: OrchestratorSubtask[];
  artifacts: GeneratedArtifact[];
  summary?: string;
  verificationSummary?: string;
  startedAt: number;
  completedAt?: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  modelUsed?: string;
  groundingSources?: GroundingSource[];
  isStreaming?: boolean;
  error?: string;
  reactions?: {
    liked?: boolean;
    disliked?: boolean;
  };
  // Advanced Task Orchestrator & Mission Mode payload
  orchestrationPlan?: OrchestrationPlan;
  missionState?: MissionState;
  artifacts?: GeneratedArtifact[];
  isOrchestrating?: boolean;
  isMissionMode?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  modelId: string;
  personaId?: string;
  customSystemPrompt?: string;
  temperature?: number;
  enableWebSearch?: boolean;
  isPinned?: boolean;
  orchestratorMode?: "auto" | "always" | "off";
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: string;
  badge: string;
  category: string;
  provider?: "gemini" | "ollama";
  isLocal?: boolean;
  supportsSearch: boolean;
  supportsVision: boolean;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  iconName: string;
  systemPrompt: string;
  category: "General" | "Coding" | "Writing" | "Analysis" | "Productivity";
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: string;
  createdAt: string;
  isGuest?: boolean;
}

export interface KeyTelemetryItem {
  id: string;
  index: number;
  maskedKey: string;
  status: "healthy" | "cooling_down" | "invalid";
  cooldownUntil: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastUsedAt: number;
  lastError?: string;
}

export interface ProviderPoolStatus {
  geminiPool: {
    totalKeys: number;
    healthyKeys: number;
    coolingDownKeys: number;
    keys: KeyTelemetryItem[];
    activeKeyIndex: number;
  };
  ollama: {
    isConnected: boolean;
    baseUrl: string;
    models: Array<{ name: string; model: string; size: number; details?: any }>;
    defaultModel?: string;
    version?: string;
    error?: string;
  };
  failoverReady: boolean;
  timestamp: string;
}

export interface AppSettings {
  theme: "dark" | "light" | "system";
  defaultModelId: string;
  defaultPersonaId: string;
  temperature: number;
  soundEffects: boolean;
  autoScroll: boolean;
  fontSize: "compact" | "normal" | "comfortable";
  codeWrap: boolean;
  speechVoice?: string;
  speechRate: number;
  orchestratorMode: "auto" | "always" | "off";
  ollamaBaseUrl?: string;
  enableOllamaFallback?: boolean;
}

// ==========================================
// MISSION MODE TYPES & INTERFACES
// ==========================================

export type MissionPhase =
  | "understanding"
  | "planning"
  | "executing"
  | "approval_gate"
  | "verifying"
  | "recovering"
  | "synthesizing"
  | "completed"
  | "paused"
  | "cancelled"
  | "failed";

export type MissionTaskStatus =
  | "pending"
  | "ready"
  | "running"
  | "verifying"
  | "awaiting_approval"
  | "completed"
  | "retrying"
  | "recovering"
  | "failed"
  | "skipped"
  | "cancelled";

export type ApprovalDangerLevel = "low" | "medium" | "high" | "critical";

export interface ApprovalGateRequest {
  id: string;
  missionId: string;
  taskId: string;
  taskTitle: string;
  actionType: string;
  dangerLevel: ApprovalDangerLevel;
  title: string;
  description: string;
  impactDescription: string;
  isIrreversible: boolean;
  status: "pending" | "approved" | "rejected";
  requestedAt: number;
  decidedAt?: number;
  decisionReason?: string;
  decisionBy?: string;
}

export interface MissionTask {
  id: string;
  title: string;
  description: string;
  capability: OrchestratorCapability;
  status: MissionTaskStatus;
  stageIndex: number; // Wave index in DAG
  canRunInParallel: boolean;
  dependsOn: string[]; // Prerequisites (Task IDs)
  assignedAgentId: string;
  assignedAgentName: string;
  selectedTools: string[];
  routingConfidence: number;
  isIrreversible?: boolean;
  requiresApproval?: boolean;
  approvalRequest?: ApprovalGateRequest;
  retryCount: number;
  maxRetries: number;
  fallbackAgentId?: string;
  fallbackAgentName?: string;
  recoveryAttempted?: boolean;
  output?: string;
  error?: string;
  verificationResult?: VerificationResult;
  durationMs?: number;
  startedAt?: number;
  completedAt?: number;
  artifacts?: GeneratedArtifact[];
  logs: string[];
}

export interface MissionDAGStage {
  stageIndex: number;
  name: string;
  taskIds: string[];
  isParallel: boolean;
}

export interface MissionDAG {
  totalTasks: number;
  stages: MissionDAGStage[];
  dependencies: Record<string, string[]>;
  estimatedTotalDurationMs: number;
}

export interface MissionVerificationOverall {
  verified: boolean;
  score: number; // 0 - 100
  checksPassed: string[];
  summary: string;
}

export interface MissionState {
  id: string;
  objective: string;
  detectedIntent: string;
  scope: string[];
  constraints: string[];
  targetDeliverables: string[];
  phase: MissionPhase;
  overallProgress: number; // 0 to 100
  progress?: number;
  tasks: MissionTask[];
  dag: MissionDAG;
  activeAgentIds: string[];
  activeAgentNames: string[];
  completedTaskCount: number;
  failedTaskCount: number;
  retriedTaskCount: number;
  artifacts: GeneratedArtifact[];
  pendingApprovals: ApprovalGateRequest[];
  resolvedApprovals: ApprovalGateRequest[];
  finalSynthesis?: string;
  verificationOverall?: MissionVerificationOverall;
  controlState: "running" | "paused" | "cancelled" | "completed" | "awaiting_approval" | "failed";
  startedAt: number;
  createdAt?: number;
  pausedAt?: number;
  resumedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface MissionControlActionRequest {
  action: "pause" | "resume" | "cancel" | "retry" | "approve" | "reject";
  taskId?: string;
  approvalId?: string;
  decisionReason?: string;
}

export interface MissionTestReport {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: Array<{
    testName: string;
    passed: boolean;
    durationMs: number;
    error?: string;
    details?: any;
  }>;
}

export interface MissionEventPayload {
  missionId: string;
  type:
    | "phase_changed"
    | "phase_change"
    | "dag_created"
    | "stage_started"
    | "task_started"
    | "task_progress"
    | "task_verifying"
    | "task_completed"
    | "task_failed"
    | "task_recovering"
    | "task_retried"
    | "approval_required"
    | "approval_resolved"
    | "mission_paused"
    | "mission_resumed"
    | "mission_cancelled"
    | "mission_completed"
    | "mission_failed"
    | "artifact_created"
    | "synthesis_ready"
    | "mission_started";
  timestamp: number;
  missionState?: MissionState;
  message?: string;
  task?: MissionTask;
  taskId?: string;
  approval?: ApprovalGateRequest;
  artifact?: GeneratedArtifact;
  phase?: MissionPhase;
  progress?: number;
  details?: any;
}

// ==========================================
// UNIFIED WORKSPACE & PROJECT TYPES
// ==========================================

export type WorkspaceView =
  | "chat"
  | "missions"
  | "projects"
  | "files"
  | "agents"
  | "artifacts"
  | "memory"
  | "settings";

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  type: "image" | "document" | "code" | "data";
  mimeType: string;
  size: number;
  textContent?: string;
  content?: string;
  dataUrl?: string;
  uploadedAt: number;
  tags?: string[];
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  conversations: Conversation[];
  files: ProjectFile[];
  missions: MissionState[];
  artifacts: GeneratedArtifact[];
  memories: MemoryEntry[];
  settings?: Partial<AppSettings>;
  isArchived?: boolean;
}



