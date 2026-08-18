import { puter } from "@heyputer/puter.js";
import { Message, GroundingSource } from "../types";

export interface PuterChatParams {
  messages: Message[];
  modelId?: string;
  systemInstruction?: string;
  temperature?: number;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

/**
 * Maps ShawezGPT model IDs to Puter.js supported AI models:
 * - claude-3-5-sonnet (Anthropic Flagship)
 * - gpt-4o (OpenAI Flagship)
 * - gpt-4o-mini
 * - deepseek-r1 / deepseek-chat
 * - mistral-large-latest
 */
export function mapToPuterModel(modelId?: string): string {
  if (!modelId) return "claude-3-5-sonnet";
  const m = modelId.toLowerCase();

  if (m.includes("claude") || m.includes("sonnet")) {
    return "claude-3-5-sonnet";
  }
  if (m.includes("deepseek") || m.includes("reasoning") || m.includes("r1")) {
    return "deepseek-r1";
  }
  if (m.includes("4o-mini") || m.includes("mini")) {
    return "gpt-4o-mini";
  }
  if (m.includes("gpt-4") || m.includes("gpt-4o") || m.includes("chatgpt")) {
    return "gpt-4o";
  }
  if (m.includes("mistral")) {
    return "mistral-large-latest";
  }

  return "claude-3-5-sonnet";
}

/**
 * Executes a streaming chat via Puter.js AI free multi-model gateway.
 * Zero developer API keys required - 100% free client-side serverless engine.
 */
export async function streamPuterChat({
  messages,
  modelId,
  systemInstruction,
  temperature = 0.7,
  onChunk,
  signal,
}: PuterChatParams): Promise<{ fullText: string; sources: GroundingSource[] }> {
  const puterModel = mapToPuterModel(modelId);

  // Format messages into Puter / OpenAI compatible format
  const formattedMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

  if (systemInstruction && systemInstruction.trim()) {
    formattedMessages.push({
      role: "system",
      content: systemInstruction.trim(),
    });
  }

  for (const msg of messages) {
    let text = msg.content || "";

    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.textContent) {
          text += `\n\n[Attached File: ${att.name || "document"}]\n\`\`\`\n${att.textContent.slice(0, 40000)}\n\`\`\``;
        }
      }
    }

    if (!text.trim()) text = "Hello";

    formattedMessages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: text,
    });
  }

  try {
    // Attempt streaming with puter.ai.chat(messages, { model, stream: true })
    const responseStream: any = await puter.ai.chat(formattedMessages, {
      model: puterModel,
      stream: true,
      temperature,
    });

    let fullText = "";

    if (responseStream && typeof responseStream[Symbol.asyncIterator] === "function") {
      for await (const chunk of responseStream) {
        if (signal?.aborted) break;
        const chunkText = chunk?.text || chunk?.message?.content || chunk?.delta?.content || "";
        if (chunkText) {
          fullText += chunkText;
          onChunk(chunkText);
        }
      }
    } else if (responseStream?.message?.content) {
      fullText = responseStream.message.content;
      onChunk(fullText);
    } else if (typeof responseStream === "string") {
      fullText = responseStream;
      onChunk(fullText);
    }

    if (fullText.trim().length > 0) {
      return { fullText, sources: [] };
    }

    // Fallback to non-streaming if stream was empty
    const nonStreamRes: any = await puter.ai.chat(formattedMessages, {
      model: puterModel,
      stream: false,
      temperature,
    });

    const outputText =
      typeof nonStreamRes === "string"
        ? nonStreamRes
        : nonStreamRes?.message?.content || nonStreamRes?.text || "";

    if (outputText) {
      onChunk(outputText);
      return { fullText: outputText, sources: [] };
    }

    throw new Error(`Puter model ${puterModel} returned an empty response.`);
  } catch (err: any) {
    console.warn(`[PuterProvider] Error with model ${puterModel}:`, err?.message || err);
    throw err;
  }
}
