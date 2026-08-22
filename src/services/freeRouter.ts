import { GroundingSource, Message } from "../types";
import { streamDirectGemini } from "./directGemini";
import { streamPuterChat } from "./puterProvider";
import { streamNvidiaNim, getNvidiaApiKey } from "./nvidiaProvider";
import { streamGroq, getGroqApiKey } from "./groqProvider";

export interface UnifiedStreamParams {
  messages: Message[];
  modelId?: string;
  systemInstruction?: string;
  temperature?: number;
  enableWebSearch?: boolean;
  onChunk: (text: string) => void;
  onGrounding?: (sources: GroundingSource[]) => void;
  signal?: AbortSignal;
}

/**
 * Stream directly from local Ollama instance (100% offline, zero-quota)
 */
async function streamLocalOllama({
  messages,
  modelId,
  systemInstruction,
  temperature = 0.7,
  onChunk,
  signal,
}: UnifiedStreamParams): Promise<{ fullText: string; sources: GroundingSource[]; modelUsed: string }> {
  const cleanModel = (modelId || "").replace(/^ollama[:\/]/, "") || "qwen2.5:7b";
  const formattedMessages: Array<{ role: string; content: string }> = [];

  if (systemInstruction && systemInstruction.trim()) {
    formattedMessages.push({ role: "system", content: systemInstruction.trim() });
  }

  for (const m of messages) {
    let content = m.content || "";
    if (m.attachments && m.attachments.length > 0) {
      for (const att of m.attachments) {
        if (att.textContent) {
          content += `\n\n[Attached File: ${att.name || "document"}]\n\`\`\`\n${att.textContent.slice(0, 30000)}\n\`\`\``;
        }
      }
    }
    if (!content.trim()) content = "Hello";
    formattedMessages.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content,
    });
  }

  const response = await fetch("http://127.0.0.1:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: cleanModel,
      messages: formattedMessages,
      stream: true,
      options: {
        temperature,
      },
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP error ${response.status}: Failed to reach model '${cleanModel}'. Ensure Ollama is running.`);
  }

  if (!response.body) throw new Error("No readable stream from Ollama.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const data = JSON.parse(trimmed);
        const chunkText = data.message?.content || "";
        if (chunkText) {
          fullText += chunkText;
          onChunk(chunkText);
        }
      } catch {}
    }
  }

  return { fullText, sources: [], modelUsed: `ollama:${cleanModel}` };
}

/**
 * Universal Smart AI Router:
 * Multi-Tier Flagship AI Orchestrator supporting:
 * 1. Local Ollama (100% Offline & Private on user's PC)
 * 2. NVIDIA NIM Cloud (DeepSeek-R1, Llama 3.3 70B, Nemotron 70B, Mistral Large)
 * 3. Groq LPU (Ultra-Fast 500+ Tokens/sec Llama 3.3 & Qwen Coder)
 * 4. Google Gemini Multi-Key Pool (Claude 3.5, GPT-4o, DeepSeek-R1, Meta Llama 3.3, and Gemini 2.5 Flash/Pro with continuous failover)
 *
 * Implements Instant Zero-Delay Auto-Failover across all tiers!
 */
export async function streamUnifiedAI({
  messages,
  modelId = "claude-3-5-sonnet",
  systemInstruction,
  temperature = 0.7,
  enableWebSearch = false,
  onChunk,
  onGrounding,
  signal,
}: UnifiedStreamParams): Promise<{ fullText: string; sources: GroundingSource[]; modelUsed: string }> {
  const m = (modelId || "").toLowerCase();

  // TIER 0: OmniRoute Universal Smart Intent Routing
  if (m.includes("omni")) {
    const lastMsg = messages.filter((msg) => msg.role === "user").pop();
    const promptText = (lastMsg?.content || "").toLowerCase();
    
    let resolvedModel = "gemini-2.5-flash";
    if (promptText.includes("code") || promptText.includes("function") || promptText.includes("error") || promptText.includes("bug") || promptText.includes("component") || promptText.includes("api") || promptText.includes("typescript")) {
      resolvedModel = "claude-3-5-sonnet";
    } else if (promptText.includes("prove") || promptText.includes("calculate") || promptText.includes("logic") || promptText.includes("math") || promptText.includes("why")) {
      resolvedModel = "deepseek-r1";
    } else if (promptText.includes("swarm") || promptText.includes("ruflo") || promptText.includes("security") || promptText.includes("audit")) {
      resolvedModel = "gemini-2.5-pro";
    }

    try {
      console.log(`[SmartRouter] OmniRoute dynamically selected: ${resolvedModel}`);
      const res = await streamDirectGemini({
        messages,
        modelId: resolvedModel,
        systemInstruction,
        temperature,
        enableWebSearch,
        onChunk,
        onGrounding,
        signal,
      });
      return { fullText: res.fullText, sources: res.sources, modelUsed: `OmniRoute (${resolvedModel})` };
    } catch (omniErr: any) {
      if (signal?.aborted) throw omniErr;
      console.warn(`[SmartRouter] OmniRoute primary failed, falling back to Flash...`);
    }
  }

  // TIER 0.5: Local Ollama (if user selected an Ollama model)
  if (m.startsWith("ollama:") || m.startsWith("ollama/")) {
    try {
      console.log(`[SmartRouter] Routing to Local Ollama (${modelId})...`);
      return await streamLocalOllama({
        messages,
        modelId,
        systemInstruction,
        temperature,
        onChunk,
        signal,
      });
    } catch (ollamaErr: any) {
      if (signal?.aborted) throw ollamaErr;
      console.warn(`[SmartRouter] Local Ollama failed (${ollamaErr?.message}), falling back to cloud engine...`);
      onChunk(`> ℹ️ *Local Ollama was not reachable. Seamlessly switching to Shawez Cloud Engine...*\n\n`);
    }
  }

  // TIER 1: NVIDIA NIM (if user configured NVIDIA key or selected NVIDIA model)
  if ((m.includes("nemotron") || m.includes("nvidia")) && getNvidiaApiKey()) {
    try {
      console.log(`[SmartRouter] Routing to NVIDIA NIM Engine (${modelId})...`);
      const result = await streamNvidiaNim({
        messages,
        modelId,
        systemInstruction,
        temperature,
        onChunk,
        signal,
      });
      return { fullText: result.fullText, sources: result.sources, modelUsed: `NVIDIA NIM: ${modelId}` };
    } catch (err: any) {
      if (signal?.aborted) throw err;
      console.warn(`[SmartRouter] NVIDIA NIM failed (${err?.message}), falling back to Gemini Engine...`);
    }
  }

  // TIER 2: Groq Ultra-Fast LPU (if user configured Groq key or selected Groq model)
  if ((m.includes("groq") || m.includes("llama-3.3")) && getGroqApiKey()) {
    try {
      console.log(`[SmartRouter] Routing to Groq Ultra-Fast LPU (${modelId})...`);
      const result = await streamGroq({
        messages,
        modelId,
        systemInstruction,
        temperature,
        onChunk,
        signal,
      });
      return { fullText: result.fullText, sources: result.sources, modelUsed: `Groq LPU: ${modelId}` };
    } catch (err: any) {
      if (signal?.aborted) throw err;
      console.warn(`[SmartRouter] Groq LPU failed (${err?.message}), falling back to Gemini Engine...`);
    }
  }

  // TIER 2.5: OpenRouter Free Models Gateway (DeepSeek R1, Meta Llama 3.3, Qwen Coder)
  if (m.includes("openrouter") || m.includes(":free")) {
    try {
      const { streamOpenRouter } = await import("./openrouterProvider");
      console.log(`[SmartRouter] Routing to OpenRouter Free Gateway (${modelId})...`);
      const result = await streamOpenRouter({
        messages,
        modelId,
        systemInstruction,
        temperature,
        onChunk,
        signal,
      });
      return { fullText: result.fullText, sources: result.sources, modelUsed: `OpenRouter: ${modelId}` };
    } catch (err: any) {
      if (signal?.aborted) throw err;
      console.warn(`[SmartRouter] OpenRouter Free Gateway failed (${err?.message}), falling back to Gemini Engine...`);
    }
  }

  // TIER 3: Universal Cloud Multi-Key Pool (Direct High-Speed Execution)
  // Supports Claude 3.5 Sonnet, GPT-4o, DeepSeek-R1, Meta Llama 3.3 70B, and Shawez Turbo 2.5
  try {
    console.log(`[SmartRouter] Routing to Universal Cloud Engine (${modelId})...`);
    const geminiRes = await streamDirectGemini({
      messages,
      modelId,
      systemInstruction,
      temperature,
      enableWebSearch,
      onChunk,
      onGrounding,
      signal,
    });

    return {
      fullText: geminiRes.fullText,
      sources: geminiRes.sources,
      modelUsed: modelId,
    };
  } catch (cloudErr: any) {
    if (signal?.aborted) throw cloudErr;
    console.warn(`[SmartRouter] Primary cloud engine encountered error (${cloudErr?.message}), attempting emergency fallback...`);
    
    // Emergency Fallback to Gemini 2.5 Flash
    const fallbackRes = await streamDirectGemini({
      messages,
      modelId: "gemini-2.5-flash",
      systemInstruction,
      temperature,
      enableWebSearch,
      onChunk,
      onGrounding,
      signal,
    });

    return {
      fullText: fallbackRes.fullText,
      sources: fallbackRes.sources,
      modelUsed: `${modelId} (Auto Failover)`,
    };
  }
}
