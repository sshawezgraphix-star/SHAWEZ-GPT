import {
  MemoryApprovalStatus,
  MemoryEntry,
  MemoryPrivacy,
  MemoryQuery,
  MemoryStats,
  MemoryType,
} from "../../src/types";
import { validateAndSanitizeMemoryPayload } from "./sanitizer";

/**
 * Default seed memories representing active project context and general developer preferences
 */
const INITIAL_MEMORIES: Array<Omit<MemoryEntry, "id" | "createdAt" | "updatedAt" | "accessCount" | "tokenCountEstimate">> = [
  {
    type: "user_preference",
    title: "TypeScript & Production Best Practices",
    content: "Always write robust, type-safe TypeScript code without `any`. Include error boundaries and follow modular component structures.",
    summary: "Mandates type safety and modular components.",
    tags: ["typescript", "standards", "code-quality"],
    importance: 5,
    privacy: "public",
    approvalStatus: "approved",
    source: "user",
    metadata: { author: "system-seed" },
  },
  {
    type: "user_preference",
    title: "Executive Markdown & Table Formatting",
    content: "When generating technical reports or summaries, use clean headings, concise bullet points, and markdown tables for comparisons.",
    summary: "Preferences for clear markdown structure and tables.",
    tags: ["formatting", "markdown", "reports"],
    importance: 4,
    privacy: "public",
    approvalStatus: "approved",
    source: "user",
  },
  {
    type: "project_specific",
    title: "ShawezGPT Architecture & Component Rules",
    content: "ShawezGPT is built with Express on port 3000, Vite React frontend, Tailwind CSS v4, and dynamic Agent and Tool Registries. All Gemini calls are executed server-side.",
    summary: "Core stack details: Express, Vite, Tailwind v4, Agent/Tool Registries.",
    projectId: "shawezgpt-main",
    tags: ["architecture", "stack", "vite", "express", "tailwind"],
    importance: 5,
    privacy: "project_only",
    approvalStatus: "approved",
    source: "system",
  },
  {
    type: "decision_record",
    title: "ADR-001: Dynamic Agent & Tool Registry Architecture",
    content: "Decision: Decouple agent capabilities into a dynamic Agent Registry with JSONSchema inputs/outputs, and manage external capabilities via sandboxed Tool Registries.",
    summary: "ADR: Dynamic agent registry with JSONSchema validation and sandboxed tools.",
    projectId: "shawezgpt-main",
    tags: ["adr", "registry", "orchestrator", "architecture"],
    importance: 5,
    privacy: "project_only",
    approvalStatus: "approved",
    source: "orchestrator",
  },
  {
    type: "decision_record",
    title: "ADR-002: Client-Side PDF Generation via JSPDF AutoTable",
    content: "Decision: PDF deliverables are generated and styled on the client side using jspdf and jspdf-autotable to deliver instant, vector-crisp documents without backend render dependencies.",
    summary: "ADR: Client-side PDF compilation using JSPDF AutoTable.",
    projectId: "shawezgpt-main",
    tags: ["adr", "pdf", "jspdf", "client-rendering"],
    importance: 4,
    privacy: "project_only",
    approvalStatus: "approved",
    source: "orchestrator",
  },
  {
    type: "file_project_context",
    title: "Workspace Directory Layout",
    content: "Frontend components reside in `src/components/`, server routes in `server.ts`, dynamic registries in `server/registry/`, and memory engine in `server/memory/`.",
    summary: "Overview of workspace codebase layout.",
    projectId: "shawezgpt-main",
    tags: ["files", "directory", "codebase"],
    importance: 4,
    privacy: "project_only",
    approvalStatus: "approved",
    source: "system",
  },
  {
    type: "long_term_user",
    title: "User Profile: Shawez",
    content: "The primary user is Shawez (sshawezgraphix@gmail.com), a full-stack engineer and designer who values sleek UI craft, rigorous architectural standards, and automated testing.",
    summary: "User preferences for clean design craft, strict architecture, and tests.",
    tags: ["user-profile", "identity", "craft"],
    importance: 4,
    privacy: "public",
    approvalStatus: "approved",
    source: "user",
  },
];

/**
 * Production-ready In-Memory Store for Memory & Context Engine
 */
export class MemoryStore {
  private memories: Map<string, MemoryEntry> = new Map();
  private sanitizedCount: number = 0;

  constructor() {
    this.seedInitialMemories();
  }

  private seedInitialMemories() {
    const now = Date.now();
    for (const item of INITIAL_MEMORIES) {
      const id = "mem_" + Math.random().toString(36).substring(2, 9);
      const entry: MemoryEntry = {
        ...item,
        id,
        createdAt: now - 3600000 * 24, // 1 day ago
        updatedAt: now - 3600000 * 24,
        accessCount: 1,
        tokenCountEstimate: this.estimateTokens(item.title + " " + item.content),
      };
      this.memories.set(id, entry);
    }
  }

  /**
   * Helper: Roughly estimates token count (1 token ~= 4 chars)
   */
  public estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Creates a new memory with automatic credential sanitization
   */
  public create(payload: {
    type?: MemoryType;
    title: string;
    content: string;
    summary?: string;
    projectId?: string;
    sessionId?: string;
    tags?: string[];
    importance?: number;
    privacy?: MemoryPrivacy;
    approvalStatus?: MemoryApprovalStatus;
    source?: "user" | "auto_extracted" | "system" | "orchestrator";
    metadata?: Record<string, any>;
  }): { entry: MemoryEntry; wasRedacted: boolean; warnings: string[] } {
    const { safeContent, safeTitle, wasRedacted, warnings } =
      validateAndSanitizeMemoryPayload(payload.content, payload.title);

    if (wasRedacted) {
      this.sanitizedCount++;
    }

    const id = "mem_" + Math.random().toString(36).substring(2, 9);
    const now = Date.now();
    const tokenCount = this.estimateTokens(safeTitle + " " + safeContent);

    const entry: MemoryEntry = {
      id,
      type: payload.type || "long_term_user",
      title: safeTitle || "Untitled Memory",
      content: safeContent,
      summary: payload.summary || (safeContent.length > 100 ? safeContent.substring(0, 97) + "..." : safeContent),
      projectId: payload.projectId,
      sessionId: payload.sessionId,
      tags: Array.isArray(payload.tags) ? payload.tags.map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
      importance: typeof payload.importance === "number" ? Math.min(Math.max(payload.importance, 1), 5) : 3,
      privacy: payload.privacy || (payload.projectId ? "project_only" : "public"),
      approvalStatus: payload.approvalStatus || (payload.source === "auto_extracted" ? "pending" : "approved"),
      source: payload.source || "user",
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
      tokenCountEstimate: tokenCount,
      metadata: payload.metadata || {},
    };

    this.memories.set(id, entry);
    return { entry, wasRedacted, warnings };
  }

  /**
   * Retrieves a single memory by ID
   */
  public get(id: string): MemoryEntry | null {
    const entry = this.memories.get(id);
    if (!entry) return null;
    return { ...entry };
  }

  /**
   * Updates an existing memory with sanitization
   */
  public update(
    id: string,
    patch: Partial<Omit<MemoryEntry, "id" | "createdAt">>
  ): { entry: MemoryEntry | null; wasRedacted: boolean; warnings: string[] } {
    const existing = this.memories.get(id);
    if (!existing) {
      return { entry: null, wasRedacted: false, warnings: [`Memory with id '${id}' not found.`] };
    }

    let safeContent = existing.content;
    let safeTitle = existing.title;
    let wasRedacted = false;
    const warnings: string[] = [];

    if (patch.content !== undefined || patch.title !== undefined) {
      const sanitized = validateAndSanitizeMemoryPayload(
        patch.content !== undefined ? patch.content : existing.content,
        patch.title !== undefined ? patch.title : existing.title
      );
      safeContent = sanitized.safeContent;
      safeTitle = sanitized.safeTitle;
      wasRedacted = sanitized.wasRedacted;
      if (wasRedacted) {
        this.sanitizedCount++;
        warnings.push(...sanitized.warnings);
      }
    }

    const updated: MemoryEntry = {
      ...existing,
      ...patch,
      id: existing.id,
      title: safeTitle,
      content: safeContent,
      tags: patch.tags
        ? patch.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
        : existing.tags,
      importance:
        typeof patch.importance === "number"
          ? Math.min(Math.max(patch.importance, 1), 5)
          : existing.importance,
      updatedAt: Date.now(),
      tokenCountEstimate: this.estimateTokens(safeTitle + " " + safeContent),
    };

    this.memories.set(id, updated);
    return { entry: updated, wasRedacted, warnings };
  }

  /**
   * Deletes a memory by ID
   */
  public delete(id: string): boolean {
    return this.memories.delete(id);
  }

  /**
   * Approves a pending memory
   */
  public approve(id: string): boolean {
    const entry = this.memories.get(id);
    if (!entry) return false;
    entry.approvalStatus = "approved";
    entry.updatedAt = Date.now();
    return true;
  }

  /**
   * Rejects a pending memory
   */
  public reject(id: string): boolean {
    const entry = this.memories.get(id);
    if (!entry) return false;
    entry.approvalStatus = "rejected";
    entry.updatedAt = Date.now();
    return true;
  }

  /**
   * Record access to memory
   */
  public recordAccess(id: string) {
    const entry = this.memories.get(id);
    if (entry) {
      entry.accessCount = (entry.accessCount || 0) + 1;
      entry.lastAccessedAt = Date.now();
    }
  }

  /**
   * Gets all memories
   */
  public getAll(): MemoryEntry[] {
    return Array.from(this.memories.values()).map((m) => ({ ...m }));
  }

  /**
   * Clear all memories (for testing or reset)
   */
  public clear(): void {
    this.memories.clear();
  }

  /**
   * Resets to initial seed memories
   */
  public resetToSeed(): void {
    this.memories.clear();
    this.sanitizedCount = 0;
    this.seedInitialMemories();
  }

  /**
   * Aggregates memory store telemetry and statistics
   */
  public getStats(): MemoryStats {
    const all = Array.from(this.memories.values());
    const byType: Record<MemoryType, number> = {
      short_term_conversation: 0,
      long_term_user: 0,
      project_specific: 0,
      file_project_context: 0,
      decision_record: 0,
      user_preference: 0,
    };
    const byProject: Record<string, number> = {};
    let totalEstimatedTokens = 0;
    let approved = 0;
    let pending = 0;

    for (const m of all) {
      byType[m.type] = (byType[m.type] || 0) + 1;
      if (m.projectId) {
        byProject[m.projectId] = (byProject[m.projectId] || 0) + 1;
      } else {
        byProject["global"] = (byProject["global"] || 0) + 1;
      }
      totalEstimatedTokens += m.tokenCountEstimate || 0;
      if (m.approvalStatus === "approved") approved++;
      if (m.approvalStatus === "pending") pending++;
    }

    return {
      totalMemories: all.length,
      approvedMemories: approved,
      pendingMemories: pending,
      byType,
      byProject,
      totalEstimatedTokens,
      sanitizedCount: this.sanitizedCount,
    };
  }
}

let storeInstance: MemoryStore | null = null;

export function getMemoryStore(): MemoryStore {
  if (!storeInstance) {
    storeInstance = new MemoryStore();
  }
  return storeInstance;
}
