import { GroundingSource, Message } from "../types";
import { streamDirectGemini } from "./directGemini";
import { streamPuterChat } from "./puterProvider";

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
 * Routes user prompt to the optimal flagship model (Claude 3.5 Sonnet, GPT-4o, DeepSeek-R1, Gemini 2.5 Turbo)
 * with zero rate-limit auto-failover across Puter.js and Google Gemini 3-key pool.
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

  // ROUTE 1: Puter.js Flagship Models (Claude 3.5 Sonnet, GPT-4o, DeepSeek-R1)
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

  // ROUTE 2: Google Gemini 2.5 Turbo / Pro (Direct 3-Key Pool)
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
