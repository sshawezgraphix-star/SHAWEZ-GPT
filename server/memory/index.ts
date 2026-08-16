import {
  ContextAssembly,
  MemoryEntry,
  MemoryQuery,
  MemoryRetrievalResult,
  MemoryStats,
  MemoryType,
} from "../../src/types";
import { getMemoryStore, MemoryStore } from "./store";
import { assembleContext, retrieveRankedMemories, scoreMemoryRelevance } from "./retrieval";
import { autoCaptureMemories, extractMemoryCandidates } from "./extractor";
import {
  containsSensitiveCredentials,
  sanitizeCredentials,
  validateAndSanitizeMemoryPayload,
} from "./sanitizer";

export {
  getMemoryStore,
  MemoryStore,
  assembleContext,
  retrieveRankedMemories,
  scoreMemoryRelevance,
  autoCaptureMemories,
  extractMemoryCandidates,
  containsSensitiveCredentials,
  sanitizeCredentials,
  validateAndSanitizeMemoryPayload,
};

/**
 * Top-level retrieval function for the Task Orchestrator and API
 */
export function retrieveContextForTask(
  userGoal: string,
  options: {
    projectId?: string;
    sessionId?: string;
    maxTokens?: number;
  } = {}
): ContextAssembly {
  return assembleContext(userGoal, {
    projectId: options.projectId || "shawezgpt-main",
    sessionId: options.sessionId,
    maxTokens: options.maxTokens || 1200,
  });
}

/**
 * Health check for memory engine
 */
export function runMemoryHealthCheck(): {
  status: "healthy" | "degraded" | "unhealthy";
  stats: MemoryStats;
  sanitizerWorking: boolean;
  latencyMs: number;
} {
  const start = Date.now();
  const store = getMemoryStore();
  const stats = store.getStats();

  // Test sanitizer
  const testSanitize = sanitizeCredentials("Test with secret password='supersecret'");
  const sanitizerWorking = testSanitize.sanitizedText.includes("[REDACTED_PASSWORD]");

  return {
    status: stats.totalMemories > 0 && sanitizerWorking ? "healthy" : "degraded",
    stats,
    sanitizerWorking,
    latencyMs: Date.now() - start,
  };
}
