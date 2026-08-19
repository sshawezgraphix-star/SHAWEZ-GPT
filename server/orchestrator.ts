import { GoogleGenAI } from "@google/genai";
import {
  GeneratedArtifact,
  OrchestrationPlan,
  OrchestratorCapability,
  OrchestratorSubtask,
  VerificationResult,
} from "../src/types";
import {
  getAgentRegistry,
  getToolRegistry,
  getPlannerContext,
  executeDynamicSubtask,
  verifyAgentSubtaskExecution,
  TaskRoutingResult,
} from "./registry";
import { retrieveContextForTask, autoCaptureMemories } from "./memory";
import { geminiPool } from "./providers/geminiPool";

// Helper: Extract clean text from Gemini responses
function cleanGeminiText(text?: string): string {
  if (!text) return "";
  return text.trim();
}

/**
 * Checks if a user prompt exhibits complex multi-task orchestration characteristics.
 */
export function isComplexMultiTaskRequest(prompt: string, hasAttachments: boolean): boolean {
  if (!prompt) return false;
  const lower = prompt.toLowerCase();

  // Explicit keywords
  const multiTaskKeywords = [
    "pdf",
    "report and",
    "research and",
    "research this topic",
    "turn it into",
    "give me the final file",
    "analyze and debug",
    "write tests and",
    "subtask",
    "step by step plan",
    "orchestrat",
    "create a report and",
    "generate a pdf",
    "make a document",
    "build a website and",
    "generate a ui and",
    "scrape and analyze",
    "research, analyze",
    "compare and generate",
    "first",
    "then",
    "finally",
    "pipeline",
    "1.",
    "2.",
    "3.",
  ];

  const matchedKeywords = multiTaskKeywords.filter((k) => lower.includes(k));
  if (matchedKeywords.length >= 2) return true;
  if (lower.includes("pdf") && (lower.includes("research") || lower.includes("report") || lower.includes("create") || lower.includes("generate"))) {
    return true;
  }
  if (lower.includes("debug") && (lower.includes("fix") || lower.includes("test") || lower.includes("document"))) {
    return true;
  }
  if (prompt.length > 200 && matchedKeywords.length >= 1) return true;

  return false;
}

/**
 * Step 1: INTENT ANALYSIS & DYNAMIC TASK PLANNING VIA AGENT REGISTRY & CONTEXT RETRIEVAL
 */
export async function planComplexTask(
  userGoal: string,
  attachments: any[] = [],
  ai: GoogleGenAI,
  model: string = "gemini-3.7-flash",
  projectId: string = "shawezgpt-main"
): Promise<OrchestrationPlan> {
  const planId = "plan_" + Math.random().toString(36).substring(2, 9);
  const agentRegistry = getAgentRegistry();
  const plannerContext = getPlannerContext();

  // Retrieve relevant project, preferences, and architectural memories before planning
  const retrievedContext = retrieveContextForTask(userGoal, {
    projectId,
    maxTokens: 800,
  });

  // Background auto-capture of potential memory candidates from the prompt
  try {
    autoCaptureMemories(userGoal, { projectId, autoApprove: false });
  } catch (err) {
    // Non-blocking
  }

  const agentsDescription = plannerContext.agents
    .filter((a) => a.status === "active")
    .map(
      (a) =>
        `- Agent "${a.id}" (${a.name}): ${a.purpose} [Capabilities: ${a.capabilities.join(", ")}; Tools: ${a.tools.join(", ")}]`
    )
    .join("\n");

  const toolsDescription = plannerContext.tools
    .filter((t) => t.status === "available")
    .map((t) => `- Tool "${t.id}" (${t.name}): ${t.description} [Category: ${t.category}]`)
    .join("\n");

  const memoryContextSection = retrievedContext.combinedContext
    ? `\nRETRIEVED USER PREFERENCES & ARCHITECTURAL CONTEXT:\n${retrievedContext.combinedContext}\n`
    : "";

  const prompt = `You are the master Task Planner for ShawezGPT's Production Multi-Task Orchestration Engine.
Analyze the user's request and construct a rigorous, sequential, multi-step execution plan by selecting registered agents and tools dynamically.
Respect all relevant user preferences, architectural rules, and project context retrieved below.
${memoryContextSection}
REGISTERED PRODUCTION AGENTS:
${agentsDescription}

AVAILABLE REGISTERED TOOLS:
${toolsDescription}

USER REQUEST:
"${userGoal}"

ATTACHMENTS: ${attachments.length > 0 ? `${attachments.length} attached files (${attachments.map((a) => a.name || a.type).join(", ")})` : "None"}

Respond ONLY with valid JSON in this exact structure:
{
  "detectedIntent": "Short description of user goal and deliverable",
  "complexityScore": "medium" | "high",
  "subtasks": [
    {
      "id": "task_1",
      "title": "Concise Step Title",
      "description": "Exact instruction for this specialized agent",
      "capability": "research" | "web_search" | "data_analysis" | "writing" | "pdf_doc_generation" | "coding" | "code_analysis_debugging" | "ui_website_generation" | "file_analysis" | "image_understanding" | "general_ai",
      "assignedAgentId": "agent-id-from-registry",
      "dependsOn": []
    }
  ]
}`;

  const targetModel = "gemini-2.5-flash";

  try {
    const genResult = await geminiPool.generateContent(
      targetModel,
      prompt,
      {
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    );

    const text = cleanGeminiText(genResult.text);
    const parsed = JSON.parse(text);

    const subtasks: OrchestratorSubtask[] = (parsed.subtasks || []).map(
      (st: any, idx: number) => {
        const capability = validateCapability(st.capability);
        // Dynamic discovery and task routing
        const routing = agentRegistry.routeTaskToAgent({
          capability,
          description: st.description || st.title || "",
        });

        return {
          id: st.id || `task_${idx + 1}`,
          title: st.title || `Step ${idx + 1}`,
          description: st.description || "",
          capability,
          status: "pending",
          dependsOn: Array.isArray(st.dependsOn) ? st.dependsOn : [],
          logs: [],
          assignedAgentId: routing.assignedAgent.id,
          assignedAgentName: routing.assignedAgent.name,
          selectedTools: routing.selectedTools.map((t) => t.id),
          routingConfidence: routing.confidence,
        };
      }
    );

    return {
      id: planId,
      userGoal,
      detectedIntent: parsed.detectedIntent || "Multi-task execution and deliverable synthesis",
      complexityScore: parsed.complexityScore || "medium",
      phase: "planning",
      currentStepIndex: 0,
      subtasks,
      artifacts: [],
      startedAt: Date.now(),
    };
  } catch (error) {
    console.error("Task planning fallback:", error);
    return createHeuristicPlan(planId, userGoal, attachments);
  }
}

function validateCapability(cap: string): OrchestratorCapability {
  const valid: OrchestratorCapability[] = [
    "coding",
    "code_analysis_debugging",
    "research",
    "web_search",
    "file_analysis",
    "pdf_doc_generation",
    "data_analysis",
    "writing",
    "ui_website_generation",
    "image_understanding",
    "general_ai",
  ];
  return valid.includes(cap as any) ? (cap as OrchestratorCapability) : "general_ai";
}

function createHeuristicPlan(planId: string, userGoal: string, attachments: any[]): OrchestrationPlan {
  const agentRegistry = getAgentRegistry();
  const lower = userGoal.toLowerCase();
  const rawSubtasks: Array<{ id: string; title: string; description: string; capability: OrchestratorCapability; dependsOn?: string[] }> = [];

  if (lower.includes("pdf") || lower.includes("report")) {
    rawSubtasks.push({
      id: "task_1",
      title: "Research & Fact Gathering",
      description: `Investigate key dimensions, facts, and insights for: "${userGoal.slice(0, 80)}"`,
      capability: "research",
    });
    rawSubtasks.push({
      id: "task_2",
      title: "Structured Analysis & Section Draft",
      description: "Analyze gathered facts, structure executive summary and deep technical sections.",
      capability: "writing",
      dependsOn: ["task_1"],
    });
    rawSubtasks.push({
      id: "task_3",
      title: "Compile Professional PDF Document",
      description: "Assemble verified PDF with styled typography, tables, and executive summary.",
      capability: "pdf_doc_generation",
      dependsOn: ["task_2"],
    });
  } else if (lower.includes("debug") || lower.includes("code")) {
    rawSubtasks.push({
      id: "task_1",
      title: "Code Architecture & Bug Analysis",
      description: "Inspect code structure, locate syntax errors, race conditions, or edge case failures.",
      capability: "code_analysis_debugging",
    });
    rawSubtasks.push({
      id: "task_2",
      title: "Implement Clean Bug-Free Code",
      description: "Produce robust, type-safe implementation with best engineering practices.",
      capability: "coding",
      dependsOn: ["task_1"],
    });
    rawSubtasks.push({
      id: "task_3",
      title: "Write Test Suite & Verification",
      description: "Provide automated test assertions and verification instructions.",
      capability: "coding",
      dependsOn: ["task_2"],
    });
  } else {
    rawSubtasks.push({
      id: "task_1",
      title: "Analyze Requirements & Research",
      description: "Deconstruct the problem requirements and evaluate key constraints.",
      capability: "research",
    });
    rawSubtasks.push({
      id: "task_2",
      title: "Execute Core Deliverable",
      description: "Formulate detailed solution and structured response.",
      capability: "writing",
      dependsOn: ["task_1"],
    });
  }

  const subtasks: OrchestratorSubtask[] = rawSubtasks.map((st) => {
    const routing = agentRegistry.routeTaskToAgent({
      capability: st.capability,
      description: st.description,
    });
    return {
      id: st.id,
      title: st.title,
      description: st.description,
      capability: st.capability,
      status: "pending",
      dependsOn: st.dependsOn || [],
      logs: [],
      assignedAgentId: routing.assignedAgent.id,
      assignedAgentName: routing.assignedAgent.name,
      selectedTools: routing.selectedTools.map((t) => t.id),
      routingConfidence: routing.confidence,
    };
  });

  return {
    id: planId,
    userGoal,
    detectedIntent: "Multi-step dynamic agent orchestration and deliverable generation",
    complexityScore: "medium",
    phase: "planning",
    currentStepIndex: 0,
    subtasks,
    artifacts: [],
    startedAt: Date.now(),
  };
}

/**
 * Step 2: EXECUTE SPECIALIZED SUBTASK VIA REGISTERED AGENT & TOOLS
 */
export async function executeSubtask(
  subtask: OrchestratorSubtask,
  userGoal: string,
  priorResults: Record<string, string>,
  attachments: any[],
  ai: GoogleGenAI,
  model: string = "gemini-3.7-flash"
): Promise<{
  output: string;
  artifact?: GeneratedArtifact;
  sources?: Array<{ title: string; uri: string }>;
  routing?: TaskRoutingResult;
  toolsUsed?: string[];
  executionTimeMs?: number;
}> {
  return await executeDynamicSubtask(
    subtask,
    userGoal,
    priorResults,
    attachments,
    ai,
    model
  );
}

/**
 * Step 3: RESULT VERIFICATION AGAINST AGENT SCHEMAS & TOOL RECEIPTS
 */
export function verifySubtaskExecution(
  subtask: OrchestratorSubtask,
  output: string,
  artifact?: GeneratedArtifact,
  routing?: TaskRoutingResult
): VerificationResult {
  return verifyAgentSubtaskExecution(subtask, output, artifact, routing);
}

/**
 * Step 4: FINAL RESPONSE SYNTHESIS
 */
export async function synthesizeFinalResponse(
  userGoal: string,
  plan: OrchestrationPlan,
  ai: GoogleGenAI,
  model: string = "gemini-3.7-flash"
): Promise<string> {
  const stepsSummary = plan.subtasks
    .map(
      (st, idx) =>
        `### Step ${idx + 1}: ${st.title} (${st.capability})\n**Agent**: ${st.assignedAgentName || st.assignedAgentId || "Specialized Agent"}\n**Tools**: ${(st.selectedTools || []).join(", ") || "Core Model"}\n**Status**: ${st.status} (Verified: ${st.verificationResult?.verified ? "Yes" : "No"})\n${st.output || ""}`
    )
    .join("\n\n");

  const prompt = `You are ShawezGPT, delivering the final synthesized executive response for a multi-task orchestration request executed across registered specialized AI agents.

USER'S ORIGINAL REQUEST:
"${userGoal}"

EXECUTED AND VERIFIED AGENT PIPELINE:
${stepsSummary}

ARTIFACTS PRODUCED:
${plan.artifacts.map((a) => `- ${a.title} (${a.type})`).join("\n") || "None"}

Please formulate an elegant, comprehensive, and publication-ready final response that:
1. Gives an executive summary of the entire completed workflow across the agents.
2. Presents the main deliverables clearly with rich markdown formatting (headings, bullet points, structured tables, or clean code blocks).
3. If a PDF report was requested and created, clearly state that the PDF document has been compiled and is ready for download in the attached artifact card below.
4. Keep the tone sharp, authoritative, helpful, and concise.`;

  const targetModel = "gemini-2.5-flash";

  try {
    const genResult = await geminiPool.generateContent(
      targetModel,
      prompt,
      {
        temperature: 0.4,
      }
    );

    return cleanGeminiText(genResult.text);
  } catch (error) {
    console.error("Final synthesis fallback:", error);
    return `### Final Deliverable\n\nI have completed all planned subtasks for your request:\n\n${plan.subtasks
      .map((st) => `- **${st.title}** (${st.assignedAgentName || "Agent"}): ${st.verificationResult?.details || "Completed & Verified"}`)
      .join("\n")}\n\n${plan.subtasks.map((st) => st.output).join("\n\n---\n\n")}`;
  }
}
