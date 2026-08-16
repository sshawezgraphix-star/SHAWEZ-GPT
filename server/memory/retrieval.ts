import {
  ContextAssembly,
  MemoryEntry,
  MemoryQuery,
  MemoryRetrievalResult,
  MemoryType,
} from "../../src/types";
import { getMemoryStore, MemoryStore } from "./store";

// Common stop words to filter out for keyword relevance
const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "from",
  "and", "or", "but", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "can", "could", "will", "would",
  "should", "this", "that", "these", "those", "i", "you", "he", "she", "it",
  "we", "they", "my", "your", "his", "her", "its", "our", "their", "what",
  "which", "who", "whom", "how", "when", "where", "why", "as", "if", "then",
]);

/**
 * Extracts normalized query tokens
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Multi-Factor Relevance Scoring Engine
 */
export function scoreMemoryRelevance(
  entry: MemoryEntry,
  queryText: string,
  queryTokens: string[],
  currentProjectId?: string
): { score: number; matchReason: string } {
  let score = 0;
  const reasons: string[] = [];

  const entryText = `${entry.title} ${entry.content} ${entry.summary || ""} ${entry.tags.join(" ")}`.toLowerCase();
  const entryTokens = new Set(tokenize(entryText));

  // 1. Direct Substring / Phrase Match
  const lowerQuery = queryText.toLowerCase().trim();
  if (lowerQuery.length > 3 && entryText.includes(lowerQuery)) {
    score += 40;
    reasons.push("Exact phrase match");
  }

  // 2. Token Overlap (Jaccard / Keyword matching)
  let matchedTokenCount = 0;
  for (const qToken of queryTokens) {
    if (entryTokens.has(qToken)) {
      matchedTokenCount++;
      score += 15;
    } else if (entry.tags.some((t) => t.includes(qToken) || qToken.includes(t))) {
      matchedTokenCount++;
      score += 20; // Tag match boost
    }
  }

  if (matchedTokenCount > 0) {
    reasons.push(`Matched ${matchedTokenCount} relevant keywords/tags`);
  }

  // 3. Project Relevance & Isolation
  if (currentProjectId && entry.projectId === currentProjectId) {
    score += 25;
    reasons.push("Active project context");
  }

  // 4. Memory Type Contextual Weight
  const typeBoosts: Record<MemoryType, number> = {
    decision_record: 20,
    user_preference: 18,
    project_specific: 15,
    file_project_context: 12,
    long_term_user: 10,
    short_term_conversation: 8,
  };
  score += typeBoosts[entry.type] || 5;

  // 5. Importance Multiplier (1-5 scale => 0.8x to 1.5x)
  const importanceMultiplier = 0.7 + entry.importance * 0.16;
  score = score * importanceMultiplier;

  // 6. Recency Boost (decay over 30 days)
  const daysOld = (Date.now() - entry.updatedAt) / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.max(0, 10 - daysOld * 0.33);
  score += recencyBoost;

  // 7. Frequent Access Boost
  if (entry.accessCount > 0) {
    score += Math.min(10, entry.accessCount * 2);
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(score)));
  const primaryReason = reasons.length > 0 ? reasons.join("; ") : "Base context relevance";

  return {
    score: finalScore,
    matchReason: primaryReason,
  };
}

/**
 * Searches and retrieves ranked memories matching query and constraint filters
 */
export function retrieveRankedMemories(
  query: MemoryQuery,
  store?: MemoryStore
): MemoryRetrievalResult[] {
  const memoryStore = store || getMemoryStore();
  const allMemories = memoryStore.getAll();

  const queryText = query.query || "";
  const queryTokens = tokenize(queryText);
  const minRelevance = typeof query.minRelevance === "number" ? query.minRelevance : 15;
  const limit = typeof query.limit === "number" ? query.limit : 10;

  const results: MemoryRetrievalResult[] = [];

  for (const entry of allMemories) {
    // A. Approval Status Filter
    if (!query.includePending && entry.approvalStatus !== "approved") {
      continue;
    }
    if (query.approvalStatus && entry.approvalStatus !== query.approvalStatus) {
      continue;
    }

    // B. Type Filter
    if (query.types && query.types.length > 0 && !query.types.includes(entry.type)) {
      continue;
    }

    // C. Strict Project Isolation Check
    // If a query specifies a projectId:
    // - include entries matching that projectId
    // - include entries that are global/public (no projectId or privacy === 'public')
    // - NEVER include entries belonging to a DIFFERENT project with privacy === 'project_only'
    if (query.projectId) {
      if (entry.projectId && entry.projectId !== query.projectId) {
        // Belonging to a different project!
        continue;
      }
    } else {
      // If no projectId is queried, exclude 'project_only' memories that have a specific projectId
      if (entry.projectId && entry.privacy === "project_only") {
        continue;
      }
    }

    // D. Strict Session Privacy Isolation
    if (entry.privacy === "private") {
      if (entry.sessionId) {
        if (!query.sessionId || query.sessionId !== entry.sessionId) {
          // Exclude private session memory from unauthorized session query
          continue;
        }
      }
    }

    // E. Explicit Privacy Filter
    if (query.privacyFilter && query.privacyFilter.length > 0) {
      if (!query.privacyFilter.includes(entry.privacy)) {
        continue;
      }
    }

    // E. Tag Filter
    if (query.tags && query.tags.length > 0) {
      const hasTag = query.tags.some((t) => entry.tags.includes(t.toLowerCase()));
      if (!hasTag) continue;
    }

    // Calculate score
    const { score, matchReason } = scoreMemoryRelevance(
      entry,
      queryText,
      queryTokens,
      query.projectId
    );

    if (queryText.trim().length === 0 || score >= minRelevance) {
      results.push({
        entry,
        score,
        matchReason,
      });
    }
  }

  // Sort by score descending, then importance, then updated time
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.entry.importance !== a.entry.importance) return b.entry.importance - a.entry.importance;
    return b.entry.updatedAt - a.entry.updatedAt;
  });

  const sliced = results.slice(0, limit);

  // Record access telemetry
  for (const r of sliced) {
    memoryStore.recordAccess(r.entry.id);
  }

  return sliced;
}

/**
 * Assembles and formats context for LLM prompts with token limits and automatic summarization
 */
export function assembleContext(
  userQuery: string,
  options: {
    projectId?: string;
    sessionId?: string;
    maxTokens?: number;
    store?: MemoryStore;
  } = {}
): ContextAssembly {
  const maxTokens = options.maxTokens || 1200;
  const memoryStore = options.store || getMemoryStore();

  const retrieved = retrieveRankedMemories(
    {
      query: userQuery,
      projectId: options.projectId,
      sessionId: options.sessionId,
      limit: 15,
      minRelevance: 12,
    },
    memoryStore
  );

  const preferencesList: string[] = [];
  const decisionsList: string[] = [];
  const projectList: string[] = [];
  const longTermList: string[] = [];
  const shortTermList: string[] = [];

  let currentTokens = 0;
  let summarizedCount = 0;
  const warnings: string[] = [];

  for (const item of retrieved) {
    const entry = item.entry;
    const itemTokens = entry.tokenCountEstimate || 50;

    // Check if adding this item would exceed token budget
    if (currentTokens + itemTokens > maxTokens) {
      // Use concise summary instead if available
      const summaryText = entry.summary || entry.title;
      const summaryTokens = memoryStore.estimateTokens(summaryText);

      if (currentTokens + summaryTokens <= maxTokens) {
        const formatted = `- **${entry.title}** (Summary): ${summaryText}`;
        categorizeFormattedMemory(entry.type, formatted, {
          preferencesList,
          decisionsList,
          projectList,
          longTermList,
          shortTermList,
        });
        currentTokens += summaryTokens;
        summarizedCount++;
      } else {
        warnings.push(`Context budget reached (${maxTokens} tokens); omitted low-priority items.`);
        break;
      }
    } else {
      const formatted = `- **${entry.title}**: ${entry.content}`;
      categorizeFormattedMemory(entry.type, formatted, {
        preferencesList,
        decisionsList,
        projectList,
        longTermList,
        shortTermList,
      });
      currentTokens += itemTokens;
    }
  }

  const preferencesContext = preferencesList.join("\n");
  const decisionsContext = decisionsList.join("\n");
  const projectContext = projectList.join("\n");
  const longTermContext = longTermList.join("\n");
  const shortTermContext = shortTermList.join("\n");

  const combinedSections: string[] = [];
  if (preferencesContext) {
    combinedSections.push(`### User Preferences & Guidelines:\n${preferencesContext}`);
  }
  if (decisionsContext) {
    combinedSections.push(`### Architectural Decisions & Standards:\n${decisionsContext}`);
  }
  if (projectContext) {
    combinedSections.push(`### Active Project Context:\n${projectContext}`);
  }
  if (longTermContext) {
    combinedSections.push(`### Relevant Knowledge & Facts:\n${longTermContext}`);
  }
  if (shortTermContext) {
    combinedSections.push(`### Recent Conversation State:\n${shortTermContext}`);
  }

  const combinedContext = combinedSections.join("\n\n");

  return {
    query: userQuery,
    projectId: options.projectId,
    shortTermContext,
    longTermContext,
    projectContext,
    decisionsContext,
    preferencesContext,
    combinedContext,
    totalTokensEstimate: currentTokens,
    retrievedMemories: retrieved,
    summarizedCount,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function categorizeFormattedMemory(
  type: MemoryType,
  text: string,
  targets: {
    preferencesList: string[];
    decisionsList: string[];
    projectList: string[];
    longTermList: string[];
    shortTermList: string[];
  }
) {
  switch (type) {
    case "user_preference":
      targets.preferencesList.push(text);
      break;
    case "decision_record":
      targets.decisionsList.push(text);
      break;
    case "project_specific":
    case "file_project_context":
      targets.projectList.push(text);
      break;
    case "long_term_user":
      targets.longTermList.push(text);
      break;
    case "short_term_conversation":
      targets.shortTermList.push(text);
      break;
    default:
      targets.longTermList.push(text);
  }
}
