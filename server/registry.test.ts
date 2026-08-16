import {
  getAgentRegistry,
  getToolRegistry,
  getPlannerContext,
  verifyAgentSubtaskExecution,
  runSystemHealthCheck,
} from "./registry";
import { OrchestratorSubtask } from "../src/types";

export interface TestReport {
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

export async function runRegistryTestSuite(): Promise<TestReport> {
  const startTime = Date.now();
  const results: TestReport["results"] = [];

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

  const agentRegistry = getAgentRegistry();
  const toolRegistry = getToolRegistry();

  // Test 1: Agent Registry initialization and discovery
  await runTest("1. Agent Registry Initialization & Discovery", () => {
    const allAgents = agentRegistry.getAllAgents();
    if (allAgents.length < 5) {
      throw new Error(`Expected at least 5 registered agents, found ${allAgents.length}`);
    }

    const codeAgent = agentRegistry.getAgent("code-architect-agent");
    if (!codeAgent) {
      throw new Error("Missing primary 'code-architect-agent'");
    }

    if (!codeAgent.capabilities.includes("coding") || !codeAgent.tools.includes("code_sandbox_validator")) {
      throw new Error("Code architect agent capabilities or tools mismatch");
    }

    const discoveredCodingAgents = agentRegistry.discoverAgents({ capability: "coding" });
    if (!discoveredCodingAgents.some((a) => a.id === "code-architect-agent")) {
      throw new Error("Agent discovery failed for 'coding' capability");
    }
  });

  // Test 2: Tool Registry initialization, discovery, and schema validation
  await runTest("2. Tool Registry Discovery & Parameter Validation", () => {
    const allTools = toolRegistry.getAllTools();
    if (allTools.length < 4) {
      throw new Error(`Expected at least 4 registered tools, found ${allTools.length}`);
    }

    const pdfTool = toolRegistry.getTool("pdf_compiler");
    if (!pdfTool) {
      throw new Error("Missing 'pdf_compiler' tool");
    }

    // Valid parameters
    const validParams = { title: "Architecture Report", content: "Executive content..." };
    const validCheck = toolRegistry.validateParameters("pdf_compiler", validParams);
    if (!validCheck.valid) {
      throw new Error(`Valid parameter check failed: ${validCheck.errors?.join(", ")}`);
    }

    // Invalid parameters (missing content)
    const invalidCheck = toolRegistry.validateParameters("pdf_compiler", { title: "Missing content" });
    if (invalidCheck.valid) {
      throw new Error("Expected parameter validation to fail for missing 'content'");
    }
  });

  // Test 3: Tool Permission Enforcement & Execution
  await runTest("3. Tool Permission Enforcement & Sandboxed Execution", async () => {
    // Attempt execution with lacking permissions
    const executionWithoutPerm = await toolRegistry.executeTool(
      "pdf_compiler",
      { title: "Test", content: "Test content" },
      { callerPermissions: ["read_only_view"] } // lacks artifact:create_pdf
    );

    if (executionWithoutPerm.success) {
      throw new Error("Expected tool execution to fail due to missing required permissions");
    }

    // Execution with proper permissions
    const executionWithPerm = await toolRegistry.executeTool(
      "pdf_compiler",
      { title: "Test Doc", content: "Some validated content for compilation", sectionsCount: 3 },
      { callerPermissions: ["artifact:create_pdf", "fs:write_deliverable"] }
    );

    if (!executionWithPerm.success || !executionWithPerm.data?.filename) {
      throw new Error(`Expected successful PDF tool execution: ${executionWithPerm.error}`);
    }
  });

  // Test 4: Dynamic Task Routing & Agent Selection
  await runTest("4. Dynamic Task Routing & Fallback Selection", () => {
    // Route coding subtask
    const codingRouting = agentRegistry.routeTaskToAgent({
      capability: "coding",
      description: "Implement a robust debounce utility in TypeScript",
    });

    if (codingRouting.assignedAgent.id !== "code-architect-agent") {
      throw new Error(`Expected 'code-architect-agent', got '${codingRouting.assignedAgent.id}'`);
    }
    if (!codingRouting.selectedTools.some((t) => t.id === "code_sandbox_validator")) {
      throw new Error("Expected selected tools to include 'code_sandbox_validator'");
    }

    // Route research subtask
    const researchRouting = agentRegistry.routeTaskToAgent({
      capability: "research",
      description: "Investigate latest battery density trends",
    });

    if (researchRouting.assignedAgent.id !== "web-researcher-agent") {
      throw new Error(`Expected 'web-researcher-agent', got '${researchRouting.assignedAgent.id}'`);
    }
  });

  // Test 5: Failure Handling & Degraded Agent Fallback Routing
  await runTest("5. Failure Handling & Degraded Agent Rerouting", () => {
    const originalStatus = agentRegistry.getAgent("code-architect-agent")?.status || "active";

    try {
      // Temporarily mark code architect as inactive / maintenance
      agentRegistry.updateAgentStatus("code-architect-agent", "inactive");

      // Reroute task
      const fallbackRouting = agentRegistry.routeTaskToAgent({
        capability: "coding",
        description: "Implement an LRU cache",
      });

      // Should automatically route to fallback general agent
      if (fallbackRouting.assignedAgent.id === "code-architect-agent") {
        throw new Error("Failed to reroute task away from inactive agent");
      }
      if (fallbackRouting.assignedAgent.status !== "active") {
        throw new Error("Fallback agent must be active");
      }
    } finally {
      // Restore original status
      agentRegistry.updateAgentStatus("code-architect-agent", originalStatus);
    }
  });

  // Test 6: Input & Output Schema Conformance Validation
  await runTest("6. Agent Input & Output Schema Validation", () => {
    // Input validation
    const validInput = {
      subtaskId: "st_1",
      title: "Plan Step",
      description: "Step details",
      userGoal: "Build feature",
    };
    const inputCheck = agentRegistry.validateInput("code-architect-agent", validInput);
    if (!inputCheck.valid) {
      throw new Error(`Input validation failed: ${inputCheck.errors?.join(", ")}`);
    }

    const invalidInput = { subtaskId: "st_1" }; // missing required fields
    const invalidInputCheck = agentRegistry.validateInput("code-architect-agent", invalidInput);
    if (invalidInputCheck.valid) {
      throw new Error("Expected input validation to fail for incomplete payload");
    }

    // Output validation
    const validOutput = {
      success: true,
      output: "```typescript\nconst x = 10;\n```",
    };
    const outputCheck = agentRegistry.validateOutput("code-architect-agent", validOutput);
    if (!outputCheck.valid) {
      throw new Error(`Output validation failed: ${outputCheck.errors?.join(", ")}`);
    }
  });

  // Test 7: Health Checks & Execution Verification Engine
  await runTest("7. System Health Checks & Subtask Execution Verification", async () => {
    const health = await runSystemHealthCheck();
    if (health.status !== "healthy") {
      throw new Error(`System health status expected 'healthy', got '${health.status}'`);
    }

    const mockSubtask: OrchestratorSubtask = {
      id: "task_1",
      title: "Compile Document",
      description: "Generate executive summary",
      capability: "pdf_doc_generation",
      status: "running",
      logs: [],
    };

    const mockArtifact = {
      id: "art_1",
      type: "pdf" as const,
      title: "Executive Report",
      filename: "executive_report.pdf",
      textContent: "# Executive Summary\nDetailed findings...",
      metadata: { sectionsCount: 4 },
      verified: true,
    };

    const verification = verifyAgentSubtaskExecution(
      mockSubtask,
      "# Executive Summary\nDetailed findings...",
      mockArtifact
    );

    if (!verification.verified || verification.checksPassed.length < 2) {
      throw new Error(`Verification failed: ${verification.details}`);
    }
  });

  const totalTests = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = totalTests - passed;

  return {
    suiteName: "ShawezGPT Agent & Tool Registry Production Test Suite",
    totalTests,
    passed,
    failed,
    durationMs: Date.now() - startTime,
    results,
  };
}

// Standalone runner when invoked directly via CLI (tsx server/registry.test.ts)
if (process.argv[1]?.includes("registry.test")) {
  (async () => {
    console.log("=== Running ShawezGPT Registry Test Suite ===");
    const report = await runRegistryTestSuite();
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
