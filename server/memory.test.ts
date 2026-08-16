import { MemoryStore } from "./memory/store";
import {
  containsSensitiveCredentials,
  sanitizeCredentials,
  validateAndSanitizeMemoryPayload,
} from "./memory/sanitizer";
import { assembleContext, retrieveRankedMemories } from "./memory/retrieval";
import { extractMemoryCandidates } from "./memory/extractor";
import { MemoryTestReport } from "../src/types";

export async function runMemoryTestSuite(): Promise<MemoryTestReport> {
  const startTime = Date.now();
  const results: MemoryTestReport["results"] = [];

  const runTest = async (name: string, fn: () => Promise<void> | void) => {
    const t0 = Date.now();
    try {
      await fn();
      results.push({
        testName: name,
        passed: true,
        durationMs: Date.now() - t0,
      });
    } catch (err: any) {
      results.push({
        testName: name,
        passed: false,
        durationMs: Date.now() - t0,
        error: err?.message || String(err),
      });
    }
  };

  // Dedicated test store instance for test isolation
  const store = new MemoryStore();

  // Test 1: Memory Creation & Default Value Enforcement
  await runTest("1. Memory Creation, Storage & Token Estimation", () => {
    const { entry, wasRedacted } = store.create({
      type: "user_preference",
      title: "Clean React Hooks Pattern",
      content: "Always memoize callbacks passed to deeply nested children and avoid direct state mutation.",
      tags: ["react", "hooks", "performance"],
      importance: 5,
      privacy: "public",
      approvalStatus: "approved",
    });

    if (!entry.id || !entry.id.startsWith("mem_")) {
      throw new Error(`Invalid memory ID generated: ${entry.id}`);
    }
    if (entry.tokenCountEstimate <= 0) {
      throw new Error("Token count estimation failed");
    }
    if (wasRedacted) {
      throw new Error("Clean payload should not trigger redaction");
    }

    const fetched = store.get(entry.id);
    if (!fetched || fetched.title !== "Clean React Hooks Pattern") {
      throw new Error("Memory retrieval by ID failed");
    }
  });

  // Test 2: Sensitive Credential Detection & Sanitization (Never store passwords or keys)
  await runTest("2. Privacy & Credential Leak Prevention Sanitizer", () => {
    // 2a. OpenAI Secret Key
    const openAISecret = "sk-abcdef1234567890abcdef1234567890";
    const check1 = containsSensitiveCredentials(`Here is my key: ${openAISecret}`);
    if (!check1.hasSensitive) {
      throw new Error("Failed to detect OpenAI secret key");
    }

    // 2b. Google API Key
    const googleKey = "AIzaSyD-1234567890abcdefghijklmnopqrst";
    const check2 = containsSensitiveCredentials(`Google API key: ${googleKey}`);
    if (!check2.hasSensitive) {
      throw new Error("Failed to detect Google API key");
    }

    // 2c. Password in config pattern
    const passwordText = 'database_config = { password: "SuperSecretPassword123!" }';
    const check3 = containsSensitiveCredentials(passwordText);
    if (!check3.hasSensitive) {
      throw new Error("Failed to detect password assignment in text");
    }

    // 2d. Sanitization execution in store.create
    const memoryWithKey = store.create({
      type: "project_specific",
      title: "Secret Config API key: AIzaSyD-1234567890abcdefghijklmnopqrst",
      content: `Use this auth token: Bearer abcdef1234567890abcdef1234567890123456 and password='SuperSecretPassword123!' for the service`,
      tags: ["config"],
    });

    if (!memoryWithKey.wasRedacted) {
      throw new Error("Expected memory store to flag redaction for sensitive credentials");
    }
    if (memoryWithKey.entry.content.includes("SuperSecretPassword123!")) {
      throw new Error("Raw password leaked into stored memory content!");
    }
    if (memoryWithKey.entry.content.includes("AIzaSyD-")) {
      throw new Error("Raw Google API key leaked into stored memory!");
    }
    if (!memoryWithKey.entry.content.includes("[REDACTED_PASSWORD]")) {
      throw new Error("Expected '[REDACTED_PASSWORD]' marker in sanitized output");
    }
  });

  // Test 3: Relevance-Based Retrieval & Multi-Factor Scoring
  await runTest("3. Context Retrieval & Relevance Scoring", () => {
    // Add specific searchable memories
    store.create({
      type: "decision_record",
      title: "ADR-010: Adopt Tailwind CSS v4 Plugin",
      content: "Decided to adopt Tailwind CSS v4 utilizing the modern @import '@tailwindcss/vite' plugin pipeline.",
      tags: ["tailwind", "css", "styling", "adr"],
      importance: 5,
      privacy: "public",
      approvalStatus: "approved",
    });

    store.create({
      type: "user_preference",
      title: "Database Query Formatting",
      content: "Format SQL statements with capitalized keywords and explicit column selections.",
      tags: ["sql", "database"],
      importance: 3,
      privacy: "public",
      approvalStatus: "approved",
    });

    // Query for styling / tailwind
    const results = retrieveRankedMemories(
      {
        query: "How should we configure Tailwind CSS styling in this project?",
        minRelevance: 10,
        limit: 5,
      },
      store
    );

    if (results.length === 0) {
      throw new Error("Failed to retrieve any relevant memories for Tailwind query");
    }

    const topResult = results[0];
    if (!topResult.entry.title.includes("Tailwind")) {
      throw new Error(`Expected Tailwind memory to rank #1, got '${topResult.entry.title}'`);
    }
    if (topResult.score < 30) {
      throw new Error(`Expected high relevance score (>30), got ${topResult.score}`);
    }
  });

  // Test 4: Strict Project Isolation
  await runTest("4. Strict Project Isolation & Cross-Project Privacy", () => {
    // Create memory for Project Alpha
    const alphaMem = store.create({
      type: "project_specific",
      title: "Project Alpha Database Architecture",
      content: "Project Alpha uses Spanner cluster region us-central1 with 3 read replicas.",
      projectId: "project-alpha",
      privacy: "project_only",
      approvalStatus: "approved",
    });

    // Create memory for Project Beta
    const betaMem = store.create({
      type: "project_specific",
      title: "Project Beta Cache Layer",
      content: "Project Beta uses Dragonfly Redis cluster with TLS enabled.",
      projectId: "project-beta",
      privacy: "project_only",
      approvalStatus: "approved",
    });

    // Query as Project Alpha
    const alphaResults = retrieveRankedMemories(
      {
        query: "database architecture cluster",
        projectId: "project-alpha",
      },
      store
    );

    // Verify Alpha can see Alpha memory
    const hasAlpha = alphaResults.some((r) => r.entry.id === alphaMem.entry.id);
    if (!hasAlpha) {
      throw new Error("Project Alpha failed to retrieve its own project-specific memory");
    }

    // Verify Alpha CANNOT see Project Beta's project_only memory!
    const hasBeta = alphaResults.some((r) => r.entry.id === betaMem.entry.id);
    if (hasBeta) {
      throw new Error("CRITICAL FAILURE: Project Alpha leaked Project Beta's private memory!");
    }
  });

  // Test 5: Memory Update, Status Approval & Deletion Controls
  await runTest("5. Memory Update, Approval & Deletion Controls", () => {
    const mem = store.create({
      type: "user_preference",
      title: "Initial Draft Title",
      content: "Initial draft content.",
      approvalStatus: "pending",
      importance: 2,
    });

    // Verify pending memory is excluded by default from context assembly
    const pendingCheck = retrieveRankedMemories(
      {
        query: "Initial Draft",
        includePending: false,
      },
      store
    );
    if (pendingCheck.some((r) => r.entry.id === mem.entry.id)) {
      throw new Error("Pending memory should not be returned when includePending is false");
    }

    // Approve memory
    const approved = store.approve(mem.entry.id);
    if (!approved) throw new Error("Failed to approve memory");

    const approvedCheck = store.get(mem.entry.id);
    if (approvedCheck?.approvalStatus !== "approved") {
      throw new Error("Memory approval status update failed");
    }

    // Update memory
    const { entry: updated } = store.update(mem.entry.id, {
      title: "Updated & Polished Preference",
      importance: 5,
    });
    if (!updated || updated.title !== "Updated & Polished Preference" || updated.importance !== 5) {
      throw new Error("Memory update failed");
    }

    // Delete memory
    const deleted = store.delete(mem.entry.id);
    if (!deleted || store.get(mem.entry.id) !== null) {
      throw new Error("Memory deletion failed");
    }
  });

  // Test 6: Automatic Memory Candidate Extraction
  await runTest("6. Automatic Memory Candidate Extraction", () => {
    const text = `I prefer concise bullet points with executive summaries.\nWe decided to use TypeScript strict mode for all API routes.\nThe project uses Express 4 with ESM.`;
    const candidates = extractMemoryCandidates(text, "test-project");

    if (candidates.length < 3) {
      throw new Error(`Expected 3 extracted memory candidates, got ${candidates.length}`);
    }

    const prefCandidate = candidates.find((c) => c.type === "user_preference");
    if (!prefCandidate || !prefCandidate.content.includes("concise bullet points")) {
      throw new Error("Failed to extract user preference candidate");
    }

    const decisionCandidate = candidates.find((c) => c.type === "decision_record");
    if (!decisionCandidate || !decisionCandidate.content.includes("TypeScript strict mode")) {
      throw new Error("Failed to extract decision record candidate");
    }
  });

  // Test 7: Context Assembly & Token Limit Summarization
  await runTest("7. Context Assembly & Token Budget Management", () => {
    // Add long memories
    for (let i = 1; i <= 5; i++) {
      store.create({
        type: "long_term_user",
        title: `Comprehensive Guide Part ${i}`,
        content: `Detailed documentation text block number ${i} with substantial guidelines, architectural notes, and execution specifications repeating for token consumption. `.repeat(10),
        summary: `Short summary for guide part ${i}.`,
        approvalStatus: "approved",
      });
    }

    // Assemble with strict budget of 200 tokens
    const assembly = assembleContext("Comprehensive Guide", {
      store,
      maxTokens: 200,
    });

    if (!assembly.combinedContext || assembly.combinedContext.length === 0) {
      throw new Error("Context assembly output is empty");
    }
    if (assembly.totalTokensEstimate > 300) {
      throw new Error(`Context budget exceeded: ${assembly.totalTokensEstimate} tokens`);
    }
    if (assembly.summarizedCount === 0 && (!assembly.warnings || assembly.warnings.length === 0)) {
      throw new Error("Expected automatic summarization or budget warning under tight token limit");
    }
  });

  const totalTests = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = totalTests - passed;

  return {
    suiteName: "ShawezGPT Memory & Context Engine Production Test Suite",
    totalTests,
    passed,
    failed,
    durationMs: Date.now() - startTime,
    results,
  };
}

// Standalone CLI runner
if (process.argv[1]?.includes("memory.test")) {
  (async () => {
    console.log("=== Running ShawezGPT Memory & Context Engine Test Suite ===");
    const report = await runMemoryTestSuite();
    console.log(`\nResults: ${report.passed}/${report.totalTests} passed (${report.durationMs}ms)`);
    for (const r of report.results) {
      console.log(`[${r.passed ? "PASS" : "FAIL"}] ${r.testName} (${r.durationMs}ms)`);
      if (r.error) {
        console.error(`       Error: ${r.error}`);
      }
    }
    process.exit(report.failed === 0 ? 0 : 1);
  })();
}
