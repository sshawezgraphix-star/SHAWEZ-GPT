import { MemoryApprovalStatus, MemoryPrivacy, MemoryType } from "../../src/types";
import { validateAndSanitizeMemoryPayload } from "./sanitizer";
import { getMemoryStore, MemoryStore } from "./store";

export interface ExtractedMemoryCandidate {
  type: MemoryType;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  importance: number;
  privacy: MemoryPrivacy;
  approvalStatus: MemoryApprovalStatus;
  confidence: number;
}

/**
 * Heuristic Pattern Matcher for extracting memories from user or assistant turns
 */
export function extractMemoryCandidates(
  text: string,
  projectId?: string
): ExtractedMemoryCandidate[] {
  if (!text || text.length < 15) return [];

  const candidates: ExtractedMemoryCandidate[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();

    // 1. User Preference Detection
    if (
      lower.startsWith("i prefer") ||
      lower.startsWith("always use") ||
      lower.startsWith("never use") ||
      lower.startsWith("please make sure") ||
      lower.includes("my preference is") ||
      lower.includes("i like when")
    ) {
      const { safeContent, safeTitle } = validateAndSanitizeMemoryPayload(line, "User Preference");
      candidates.push({
        type: "user_preference",
        title: safeTitle,
        content: safeContent,
        summary: safeContent.length > 80 ? safeContent.substring(0, 77) + "..." : safeContent,
        tags: ["preference", "user-instruction"],
        importance: 4,
        privacy: "public",
        approvalStatus: "pending", // user-approval flow
        confidence: 0.85,
      });
    }

    // 2. Decision Record Detection
    else if (
      lower.includes("we decided to") ||
      lower.includes("decision:") ||
      lower.includes("let's go with") ||
      lower.includes("architectural decision:") ||
      lower.includes("adr:") ||
      lower.startsWith("decision -")
    ) {
      const { safeContent, safeTitle } = validateAndSanitizeMemoryPayload(line, "Architectural Decision");
      candidates.push({
        type: "decision_record",
        title: safeTitle,
        content: safeContent,
        summary: safeContent.length > 80 ? safeContent.substring(0, 77) + "..." : safeContent,
        tags: ["decision", "architecture", "adr"],
        importance: 5,
        privacy: projectId ? "project_only" : "public",
        approvalStatus: "pending",
        confidence: 0.9,
      });
    }

    // 3. Project Context Detection
    else if (
      lower.includes("the project uses") ||
      lower.includes("our backend is") ||
      lower.includes("the database is") ||
      lower.includes("stack:")
    ) {
      const { safeContent, safeTitle } = validateAndSanitizeMemoryPayload(line, "Project Fact");
      candidates.push({
        type: "project_specific",
        title: safeTitle,
        content: safeContent,
        summary: safeContent.length > 80 ? safeContent.substring(0, 77) + "..." : safeContent,
        tags: ["project-fact", "stack"],
        importance: 4,
        privacy: "project_only",
        approvalStatus: "pending",
        confidence: 0.8,
      });
    }
  }

  return candidates;
}

/**
 * Automatically captures candidates into the memory store as pending or auto-approved
 */
export function autoCaptureMemories(
  text: string,
  options: {
    projectId?: string;
    sessionId?: string;
    autoApprove?: boolean;
    store?: MemoryStore;
  } = {}
) {
  const candidates = extractMemoryCandidates(text, options.projectId);
  const memoryStore = options.store || getMemoryStore();
  const created: any[] = [];

  for (const cand of candidates) {
    const res = memoryStore.create({
      type: cand.type,
      title: cand.title,
      content: cand.content,
      summary: cand.summary,
      tags: cand.tags,
      importance: cand.importance,
      privacy: cand.privacy,
      projectId: options.projectId,
      sessionId: options.sessionId,
      approvalStatus: options.autoApprove ? "approved" : "pending",
      source: "auto_extracted",
    });
    created.push(res);
  }

  return created;
}
