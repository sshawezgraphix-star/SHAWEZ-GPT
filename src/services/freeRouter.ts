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
 * Universal Smart AI Router:
 * Multi-Tier Flagship AI Orchestrator supporting:
 * 1. Puter.js (Claude 3.5 Sonnet, GPT-4o, DeepSeek-R1 - 100% Free Zero-Key)
 * 2. NVIDIA NIM Cloud (DeepSeek-R1, Llama 3.3 70B, Nemotron 70B, Mistral Large)
 * 3. Groq LPU (Ultra-Fast 500+ Tokens/sec Llama 3.3 & Qwen Coder)
 * 4. Google Gemini 3-Key Pool (Gemini 2.5 Flash / Pro with continuous failover)
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
  const m = modelId.toLowerCase();

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
      console.warn(`[SmartRouter] NVIDIA NIM failed (${err?.message}), falling back to Puter/Gemini...`);
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
      console.warn(`[SmartRouter] Groq LPU failed (${err?.message}), falling back to Puter/Gemini...`);
    }
  }

  // TIER 3: Puter.js Flagship Models (Claude 3.5 Sonnet, GPT-4o, DeepSeek-R1)
  if (m.includes("claude") || m.includes("gpt-4") || m.includes("deepseek") || m.includes("sonnet")) {
    try {
      console.log(`[SmartRouter] Routing to Puter.js Flagship Engine (${modelId})...`);
      const result = await streamPuterChat({
        messages,
        modelId,
        systemInstruction,
        temperature,
        onChunk,
        signal,
      });

      return {
        fullText: result.fullText,
        sources: result.sources,
        modelUsed: modelId,
      };
    } catch (puterErr: any) {
      if (signal?.aborted) throw puterErr;
      console.warn(`[SmartRouter] Puter.js engine encountered issue (${puterErr?.message}), seamlessly failing over to Gemini 3-key pool...`);
      // Fallback to Gemini 3-key pool
      const geminiRes = await streamDirectGemini({
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
        fullText: geminiRes.fullText,
        sources: geminiRes.sources,
        modelUsed: "gemini-2.5-flash (Smart Failover)",
      };
    }
  }

  // TIER 4: Google Gemini 2.5 Turbo / Pro (Direct 3-Key Pool)
  try {
    console.log(`[SmartRouter] Routing to Gemini 3-Key Pool (${modelId})...`);
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
  } catch (geminiErr: any) {
    if (signal?.aborted) throw geminiErr;
    console.warn(`[SmartRouter] Gemini 3-key pool error (${geminiErr?.message}), failing over to Puter Claude/GPT engine...`);
    // Fallback to Puter.js
    const puterRes = await streamPuterChat({
      messages,
      modelId: "claude-3-5-sonnet",
      systemInstruction,
      temperature,
      onChunk,
      signal,
    });

    return {
      fullText: puterRes.fullText,
      sources: puterRes.sources,
      modelUsed: "claude-3-5-sonnet (Smart Failover)",
    };
  }
}
