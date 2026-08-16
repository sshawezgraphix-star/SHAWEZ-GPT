import { GeneratedArtifact, OrchestratorCapability, SubtaskStatus } from "../../src/types";

export type AgentStatus = "active" | "degraded" | "inactive" | "maintenance";
export type ToolStatus = "available" | "degraded" | "unavailable";
export type ToolCategory = "search" | "generation" | "analysis" | "validation" | "utility";

export interface JSONSchemaDefinition {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  description?: string;
  items?: any;
  [key: string]: any;
}

export interface AgentMetrics {
  totalInvocations: number;
  successfulInvocations: number;
  failedInvocations: number;
  averageLatencyMs: number;
  lastExecutedAt?: number;
}

export interface ToolMetrics {
  totalCalls: number;
  successCalls: number;
  failureCalls: number;
  avgExecutionTimeMs: number;
  lastExecutedAt?: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  status: AgentStatus | ToolStatus;
  latencyMs: number;
  details?: string;
  lastChecked: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  version: string;
  parameters: JSONSchemaDefinition;
  returns: JSONSchemaDefinition;
  permissions: string[];
  status: ToolStatus;
  metrics: ToolMetrics;
  healthCheck: () => Promise<HealthCheckResult>;
  execute: (params: any, context?: ToolExecutionContext) => Promise<any>;
}

export interface ToolExecutionContext {
  agentId?: string;
  callerPermissions?: string[];
  userGoal?: string;
  aiClient?: any;
  model?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  durationMs: number;
  toolId: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  purpose: string;
  version: string;
  capabilities: OrchestratorCapability[];
  tools: string[]; // Tool IDs this agent is configured to use
  permissions: string[];
  inputSchema: JSONSchemaDefinition;
  outputSchema: JSONSchemaDefinition;
  status: AgentStatus;
  metrics: AgentMetrics;
  healthCheck: () => Promise<HealthCheckResult>;
  execute: (input: AgentExecutionInput, context: AgentExecutionContext) => Promise<AgentExecutionOutput>;
}

export interface AgentExecutionInput {
  subtaskId: string;
  title: string;
  description: string;
  capability: OrchestratorCapability;
  userGoal: string;
  priorResults: Record<string, string>;
  attachments: any[];
  customParameters?: Record<string, any>;
}

export interface AgentExecutionOutput {
  success: boolean;
  output: string;
  artifact?: GeneratedArtifact;
  sources?: Array<{ title: string; uri: string }>;
  toolsUsed?: string[];
  executionTimeMs: number;
  error?: string;
}

export interface AgentExecutionContext {
  ai: any;
  model: string;
  toolRegistry: any;
  agentRegistry: any;
}

export interface AgentDiscoveryQuery {
  capability?: OrchestratorCapability;
  requiredTools?: string[];
  requiredPermissions?: string[];
  minStatus?: AgentStatus;
}

export interface ToolDiscoveryQuery {
  category?: ToolCategory;
  requiredPermissions?: string[];
  availableOnly?: boolean;
}

export interface TaskRoutingResult {
  assignedAgent: AgentDefinition;
  selectedTools: ToolDefinition[];
  confidence: number;
  fallbackAgents: AgentDefinition[];
  capabilityMatched: boolean;
}
