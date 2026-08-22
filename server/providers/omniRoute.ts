/**
 * omniRoute.ts
 *
 * OmniRoute Intelligent Dynamic Router for ShawezGPT
 * Automatically analyzes user prompts and routes them to the optimal engine:
 *  - Coding / Scripting / Architecture -> Claude 3.5 Sonnet / Qwen Coder / Gemini 2.5 Pro
 *  - Deep Reasoning / Math / Logic -> DeepSeek-R1 / Gemini 2.5 Pro
 *  - Multi-Agent Orchestration / Research -> Ruflo 6-AI Swarm
 *  - Real-Time Search / Grounding -> RufloBrowser + Google Search Grounding
 *  - Fast Conversation -> Shawez Turbo / ChatGPT-4o
 */

import { geminiPool } from "./geminiPool";
import { streamRufloSwarm } from "./rufloSwarm";
import { getOllamaProvider, OllamaProvider } from "./ollama";

export type OmniIntent = 
  | "coding"
  | "deep_reasoning"
  | "swarm_orchestration"
  | "web_research"
  | "security_audit"
  | "fast_conversation";

export interface OmniRouteDecision {
  intent: OmniIntent;
  targetModel: string;
  reasoning: string;
  agentToInvoke?: string;
  enableSearch?: boolean;
}

/**
 * Fast zero-delay heuristic intent classifier for OmniRoute
 */
export function analyzeOmniIntent(prompt: string): OmniRouteDecision {
  const p = prompt.toLowerCase().trim();

  // 1. Security Analysis / AI Audit
  if (
    p.includes("security") ||
    p.includes("vulnerability") ||
    p.includes("penetration") ||
    p.includes("audit") ||
    p.includes("jwt") ||
    p.includes("csrf") ||
    p.includes("xss") ||
    p.includes("injection")
  ) {
    return {
      intent: "security_audit",
      targetModel: "ruflo-security",
      reasoning: "Security evaluation detected -> routed to RufloSecurity Agent",
    };
  }

  // 2. Swarm Multi-Agent Tasks
  if (
    p.includes("swarm") ||
    p.includes("ruflo") ||
    p.includes("multi-agent") ||
    p.includes("orchestrate") ||
    p.includes("full project plan") ||
    p.includes("complete system breakdown")
  ) {
    return {
      intent: "swarm_orchestration",
      targetModel: "ruflo-swarm",
      reasoning: "Multi-agent workflow detected -> routed to Ruflo Swarm Coordinator",
    };
  }

  // 3. Coding / Programming / Software Engineering
  if (
    p.includes("code") ||
    p.includes("function") ||
    p.includes("typescript") ||
    p.includes("javascript") ||
    p.includes("python") ||
    p.includes("react") ||
    p.includes("component") ||
    p.includes("debug") ||
    p.includes("error") ||
    p.includes("api") ||
    p.includes("backend") ||
    p.includes("frontend") ||
    p.includes("sql") ||
    p.includes("database") ||
    p.includes("algorithm") ||
    p.includes("css") ||
    p.includes("html") ||
    p.includes("class") ||
    p.includes("import ") ||
    p.includes("const ") ||
    p.includes("def ")
  ) {
    return {
      intent: "coding",
      targetModel: "claude-3-5-sonnet",
      reasoning: "Software engineering query detected -> routed to Claude 3.5 Sonnet / High-Performance Coder",
    };
  }

  // 4. Deep Reasoning / Math / Logic / Architecture
  if (
    p.includes("prove") ||
    p.includes("calculate") ||
    p.includes("derivation") ||
    p.includes("why does") ||
    p.includes("compare and contrast") ||
    p.includes("philosophical") ||
    p.includes("architecture decision") ||
    p.includes("step by step logic") ||
    p.includes("math")
  ) {
    return {
      intent: "deep_reasoning",
      targetModel: "deepseek-r1",
      reasoning: "Deep logic & reasoning detected -> routed to DeepSeek-R1 Deep Thinker",
    };
  }

  // 5. Real-time Search / Live News / Latest Events
  if (
    p.includes("latest") ||
    p.includes("current price") ||
    p.includes("today's news") ||
    p.includes("recent") ||
    p.includes("weather") ||
    p.includes("who won") ||
    p.includes("search for")
  ) {
    return {
      intent: "web_research",
      targetModel: "gemini-2.5-flash",
      enableSearch: true,
      reasoning: "Real-time query detected -> routed to Web-Grounded Engine",
    };
  }

  // 6. Fast General Conversation
  return {
    intent: "fast_conversation",
    targetModel: "gemini-2.5-flash",
    reasoning: "Conversational query -> routed to High-Speed Zero-Limit Engine",
  };
}

export interface StreamOmniParams {
  messages: Array<{ role: string; content: string; attachments?: any[] }>;
  systemInstruction?: string;
  temperature?: number;
  enableWebSearch?: boolean;
  onChunk: (text: string, modelUsed: string) => void;
}

/**
 * Master OmniRoute Stream Executor
 */
export async function streamOmniRoute(
  params: StreamOmniParams
): Promise<{ fullText: string; modelUsed: string }> {
  const lastUserMsg = params.messages.filter((m) => m.role === "user").pop();
  const prompt = lastUserMsg?.content || "";
  const decision = analyzeOmniIntent(prompt);

  console.log(`[OmniRoute] Intent: ${decision.intent} -> Model: ${decision.targetModel} (${decision.reasoning})`);

  // Case 1: Swarm / Security intent
  if (decision.intent === "swarm_orchestration" || decision.intent === "security_audit") {
    let accumulated = "";
    const full = await streamRufloSwarm(
      {
        prompt,
        context: params.messages.slice(0, -1).map((m) => `${m.role}: ${m.content}`).join("\n"),
        systemInstruction: params.systemInstruction,
      },
      (chunk) => {
        accumulated += chunk;
        params.onChunk(chunk, `OmniRoute: ${decision.targetModel}`);
      }
    );
    return { fullText: full, modelUsed: `OmniRoute (${decision.targetModel})` };
  }

  // Case 2: Gemini Pool Execution
  const contents = params.messages.map((m) => ({
    role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
    parts: [{ text: m.content || "Hello" }],
  }));

  const config: any = {
    temperature: params.temperature || 0.7,
    systemInstruction: params.systemInstruction
      ? { parts: [{ text: params.systemInstruction }] }
      : undefined,
  };

  if (params.enableWebSearch || decision.enableSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  let accumulated = "";
  const streamResult = await geminiPool.generateContentStream(
    decision.targetModel,
    contents,
    config
  );

  for await (const chunk of streamResult) {
    const chunkText = chunk.text || "";
    if (chunkText) {
      accumulated += chunkText;
      params.onChunk(chunkText, `OmniRoute: ${decision.targetModel}`);
    }
  }

  return { fullText: accumulated, modelUsed: `OmniRoute (${decision.targetModel})` };
}
