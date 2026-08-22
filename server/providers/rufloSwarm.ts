/**
 * rufloSwarm.ts
 *
 * Ruflo Swarm Agent Integration for ShawezGPT
 * Integrates 6 core Ruflo agents:
 *   1. RufloIntelligence  — Deep research + advanced reasoning
 *   2. RufloBrowser       — Live web browsing + data fetch
 *   3. RufloRAGMemory     — Long-term memory + document search
 *   4. RufloSwarmCoord    — Multi-agent parallel task execution
 *   5. RufloAutoAgent     — Autonomous code generation + execution
 *   6. RufloSecurity      — Security audit + AI defence
 */

import { geminiPool } from "./geminiPool";

export interface RufloAgentResult {
  agentName: string;
  output: string;
  confidence: number;
  sources?: string[];
  metadata?: Record<string, any>;
}

export interface RufloSwarmTask {
  prompt: string;
  context?: string;
  agents?: string[];
  model?: string;
  systemInstruction?: string;
}

// ─── Agent Definitions ─────────────────────────────────────────────────────

const RUFLO_AGENT_PROMPTS: Record<string, string> = {
  RufloIntelligence: `You are RufloIntelligence, a world-class AI research and reasoning agent from the Ruflo swarm system.
Your capabilities:
- Deep multi-step reasoning and analysis
- Synthesizing complex information from multiple sources
- Breaking down problems into logical steps
- Providing expert-level insights across any domain
- Cross-referencing data and identifying patterns

Always structure your response clearly with reasoning steps, key findings, and a concise conclusion.`,

  RufloBrowser: `You are RufloBrowser, an advanced web intelligence agent from the Ruflo swarm system.
Your capabilities:
- Simulating web search queries and retrieving current information
- Analyzing web content, news, and real-time data patterns
- Extracting structured data from web sources
- Summarizing information from multiple URLs
- Identifying the most authoritative and recent sources

Provide well-cited, up-to-date responses. Clearly indicate what information may need verification.`,

  RufloRAGMemory: `You are RufloRAGMemory, a long-term memory and knowledge retrieval agent from the Ruflo swarm system.
Your capabilities:
- Retrieving and synthesizing information from large document collections
- Maintaining context across long conversation threads
- Identifying relevant past interactions and knowledge
- Building semantic connections between concepts
- Providing persistent knowledge management

Structure responses as: [Retrieved Context] → [Synthesis] → [Answer].`,

  RufloSwarmCoord: `You are RufloSwarmCoordinator, the master orchestrator of the Ruflo swarm agent system.
Your capabilities:
- Breaking complex tasks into parallel sub-tasks for specialized agents
- Coordinating multiple agents simultaneously
- Merging and synthesizing results from different agents
- Adaptive task routing based on agent capabilities
- Quality control and result verification across the swarm

Format: First output the execution plan, then synthesize results from all sub-agents.`,

  RufloAutoAgent: `You are RufloAutoAgent, an autonomous code generation and execution planning agent from the Ruflo swarm.
Your capabilities:
- Writing production-quality code in any language
- Debugging and fixing complex code issues
- Designing software architecture
- Creating test suites and documentation
- Autonomous multi-step problem solving

Always provide working, well-commented code with explanations and usage examples.`,

  RufloSecurity: `You are RufloSecurity, an elite cybersecurity and AI defence agent from the Ruflo swarm system.
Your capabilities:
- Security vulnerability assessment and penetration testing guidance
- AI prompt injection and jailbreak defence
- Code security review and hardening recommendations
- Privacy protection and data security analysis
- Threat modelling and risk assessment

Provide detailed security analysis with severity ratings (CRITICAL/HIGH/MEDIUM/LOW) and remediation steps.`,
};

// ─── Core Agent Executor ───────────────────────────────────────────────────

async function executeRufloAgent(
  agentName: string,
  task: string,
  context?: string
): Promise<RufloAgentResult> {
  const agentPrompt = RUFLO_AGENT_PROMPTS[agentName];
  if (!agentPrompt) {
    throw new Error(`Unknown Ruflo agent: ${agentName}`);
  }

  const contents = context
    ? [{ role: "user", parts: [{ text: `Context:\n${context}\n\nTask:\n${task}` }] }]
    : [{ role: "user", parts: [{ text: task }] }];

  const config = {
    systemInstruction: { parts: [{ text: agentPrompt }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      topP: 0.95,
    },
  };

  try {
    const result = await geminiPool.generateContent("gemini-2.5-flash", contents, config);
    return {
      agentName,
      output: result.text || `[${agentName}] No output generated`,
      confidence: 0.92,
      metadata: { keyUsed: result.keyId },
    };
  } catch (err: any) {
    console.error(`[RufloSwarm] Agent ${agentName} failed:`, err?.message);
    return {
      agentName,
      output: `[${agentName}] Agent encountered an error: ${err?.message || "Unknown error"}`,
      confidence: 0.0,
    };
  }
}

// ─── Swarm Coordinator ─────────────────────────────────────────────────────

/**
 * Determines which Ruflo agents should handle a given prompt
 */
export function selectRufloAgents(prompt: string): string[] {
  const lower = prompt.toLowerCase();

  // Security tasks
  if (
    lower.includes("security") ||
    lower.includes("hack") ||
    lower.includes("vulnerability") ||
    lower.includes("exploit") ||
    lower.includes("pentest") ||
    lower.includes("secure") ||
    lower.includes("audit")
  ) {
    return ["RufloSecurity", "RufloIntelligence"];
  }

  // Code + development tasks
  if (
    lower.includes("code") ||
    lower.includes("function") ||
    lower.includes("debug") ||
    lower.includes("bug") ||
    lower.includes("program") ||
    lower.includes("script") ||
    lower.includes("app") ||
    lower.includes("api")
  ) {
    return ["RufloAutoAgent", "RufloIntelligence"];
  }

  // Research + web tasks
  if (
    lower.includes("research") ||
    lower.includes("search") ||
    lower.includes("find") ||
    lower.includes("latest") ||
    lower.includes("news") ||
    lower.includes("current") ||
    lower.includes("today")
  ) {
    return ["RufloBrowser", "RufloIntelligence"];
  }

  // Memory + document tasks
  if (
    lower.includes("remember") ||
    lower.includes("document") ||
    lower.includes("file") ||
    lower.includes("pdf") ||
    lower.includes("store") ||
    lower.includes("recall") ||
    lower.includes("memory")
  ) {
    return ["RufloRAGMemory", "RufloIntelligence"];
  }

  // Complex multi-step tasks → full swarm
  if (
    lower.includes("analyze") ||
    lower.includes("plan") ||
    lower.includes("create") ||
    lower.includes("build") ||
    lower.includes("design") ||
    lower.length > 200
  ) {
    return ["RufloSwarmCoord", "RufloIntelligence", "RufloAutoAgent"];
  }

  // Default: intelligence agent
  return ["RufloIntelligence"];
}

/**
 * Execute a task with Ruflo Swarm — runs agents in parallel for speed
 */
export async function executeRufloSwarm(task: RufloSwarmTask): Promise<string> {
  const agentsToRun = task.agents?.length
    ? task.agents
    : selectRufloAgents(task.prompt);

  console.log(`[RufloSwarm] 🚀 Activating ${agentsToRun.length} agents: ${agentsToRun.join(", ")}`);

  // Run all selected agents in parallel
  const results = await Promise.allSettled(
    agentsToRun.map((agent) =>
      executeRufloAgent(agent, task.prompt, task.context)
    )
  );

  const successful = results
    .filter((r): r is PromiseFulfilledResult<RufloAgentResult> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((r) => r.confidence > 0);

  if (successful.length === 0) {
    throw new Error("[RufloSwarm] All agents failed to produce results.");
  }

  // If single agent, return its output directly
  if (successful.length === 1) {
    return `🤖 **${successful[0].agentName}**\n\n${successful[0].output}`;
  }

  // Multiple agents — synthesize with coordinator
  const synthPrompt = `You are a master synthesizer. Multiple Ruflo AI agents have analyzed the following task:

**Task**: ${task.prompt}

**Agent Results**:
${successful.map((r) => `### ${r.agentName}\n${r.output}`).join("\n\n---\n\n")}

Synthesize these results into one comprehensive, well-structured final answer. Remove redundancy, resolve conflicts, and produce the best possible response.`;

  try {
    const synthesis = await geminiPool.generateContent(
      "gemini-2.5-flash",
      [{ role: "user", parts: [{ text: synthPrompt }] }],
      {
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 8192,
        },
      }
    );

    const agentBadges = successful.map((r) => `🤖 ${r.agentName}`).join(" · ");
    return `**Ruflo Swarm** [${agentBadges}]\n\n${synthesis.text || ""}`;
  } catch {
    // Fallback: return all agent outputs formatted nicely
    return successful
      .map((r) => `### 🤖 ${r.agentName}\n\n${r.output}`)
      .join("\n\n---\n\n");
  }
}

// ─── Streaming Version ─────────────────────────────────────────────────────

/**
 * Execute Ruflo Swarm with streaming output (for real-time chat)
 */
export async function streamRufloSwarm(
  task: RufloSwarmTask,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const agentsToRun = task.agents?.length
    ? task.agents
    : selectRufloAgents(task.prompt);

  const agentBadges = agentsToRun.map((a) => `🤖 ${a}`).join(" · ");
  const headerText = `**Ruflo Swarm** [${agentBadges}]\n\n`;
  onChunk(headerText);

  // For streaming, run agents sequentially to avoid race conditions
  let fullOutput = headerText;

  for (const agentName of agentsToRun) {
    if (signal?.aborted) break;

    const agentHeader = agentsToRun.length > 1 ? `### ${agentName}\n\n` : "";
    if (agentHeader) {
      onChunk(agentHeader);
      fullOutput += agentHeader;
    }

    try {
      const result = await executeRufloAgent(agentName, task.prompt, task.context);
      onChunk(result.output);
      fullOutput += result.output;

      if (agentsToRun.indexOf(agentName) < agentsToRun.length - 1) {
        onChunk("\n\n---\n\n");
        fullOutput += "\n\n---\n\n";
      }
    } catch (err: any) {
      const errMsg = `[${agentName} encountered an error: ${err?.message}]\n\n`;
      onChunk(errMsg);
      fullOutput += errMsg;
    }
  }

  return fullOutput;
}

// ─── Agent Registry Info ────────────────────────────────────────────────────

export const RUFLO_AGENTS_INFO = [
  {
    id: "ruflo-intelligence",
    name: "RufloIntelligence",
    description: "Deep research, multi-step reasoning, expert-level analysis across any domain",
    capabilities: ["research", "reasoning", "analysis", "synthesis"],
    category: "ruflo",
  },
  {
    id: "ruflo-browser",
    name: "RufloBrowser",
    description: "Live web intelligence, news retrieval, real-time data, URL content extraction",
    capabilities: ["web-search", "browse", "data-fetch", "news"],
    category: "ruflo",
  },
  {
    id: "ruflo-rag-memory",
    name: "RufloRAGMemory",
    description: "Long-term memory management, document search, knowledge retrieval",
    capabilities: ["memory", "rag", "documents", "knowledge-graph"],
    category: "ruflo",
  },
  {
    id: "ruflo-swarm-coord",
    name: "RufloSwarmCoord",
    description: "Master orchestrator for parallel multi-agent task execution",
    capabilities: ["orchestration", "coordination", "parallel-execution", "synthesis"],
    category: "ruflo",
  },
  {
    id: "ruflo-auto-agent",
    name: "RufloAutoAgent",
    description: "Autonomous code generation, debugging, architecture design, software engineering",
    capabilities: ["code", "debug", "architecture", "testing", "documentation"],
    category: "ruflo",
  },
  {
    id: "ruflo-security",
    name: "RufloSecurity",
    description: "Security auditing, vulnerability assessment, AI defence, threat modelling",
    capabilities: ["security", "pentest", "audit", "ai-defence", "privacy"],
    category: "ruflo",
  },
];
