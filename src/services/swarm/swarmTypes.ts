export type SwarmTopology = 'hierarchical' | 'mesh' | 'ring' | 'star';

export type AgentDomain =
  | 'coordinator'
  | 'architecture'
  | 'coding'
  | 'review'
  | 'security'
  | 'testing'
  | 'research'
  | 'design'
  | 'api'
  | 'optimization'
  | 'memory';

export interface SwarmAgentDefinition {
  id: string;
  name: string;
  domain: AgentDomain;
  role: string;
  description: string;
  systemPrompt: string;
  capabilities: string[];
  preferredProvider?: 'gemini' | 'groq' | 'openrouter' | 'nvidia' | 'ollama';
  icon: string;
  priority: number;
}

export interface SwarmSubtask {
  id: string;
  title: string;
  description: string;
  domain: AgentDomain;
  assignedAgentId: string;
  assignedAgentName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dependsOn?: string[];
  output?: string;
  executionTimeMs?: number;
  tokensUsed?: number;
  providerUsed?: string;
  error?: string;
}

export interface SwarmMissionPlan {
  id: string;
  userGoal: string;
  topology: SwarmTopology;
  leadAgent: SwarmAgentDefinition;
  subtasks: SwarmSubtask[];
  status: 'planning' | 'executing' | 'synthesizing' | 'completed' | 'failed';
  totalTokensEstimated: number;
  startedAt: number;
  completedAt?: number;
}

export interface SwarmMemoryPattern {
  id: string;
  key: string;
  namespace: string;
  pattern: string;
  confidence: number;
  timestamp: number;
}
