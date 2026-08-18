import { Message, GroundingSource } from "../types";

export interface NvidiaChatParams {
  messages: Message[];
  modelId?: string;
  systemInstruction?: string;
  temperature?: number;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

export const NVIDIA_NIM_MODELS: Record<string, string> = {
  "deepseek-r1": "deepseek-ai/deepseek-r1",
  "llama-3.3-70b": "meta/llama-3.3-70b-instruct",
  "nemotron-70b": "nvidia/llama-3.1-nemotron-70b-instruct",
  "mistral-large": "mistralai/mistral-large-2-instruct",
  "qwen-2.5-coder": "qwen/qwen2.5-coder-32b-instruct",
};

export function getNvidiaApiKey(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("shawezgpt_nvidia_api_key");
    if (custom && custom.trim()) return custom.trim();
  }
  return "";
}

/**
 * Streams response from NVIDIA NIM Cloud API (OpenAI-compatible /v1/chat/completions)
 */
export async function streamNvidiaNim({
  messages,
  modelId = "deepseek-r1",
  systemInstruction,
  temperature = 0.6,
  onChunk,
  signal,
}: NvidiaChatParams): Promise<{ fullText: string; sources: GroundingSource[] }> {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) {
    throw new Error("No NVIDIA NIM API Key configured. Please add it in Settings -> API Keys.");
  }

  const nvidiaModel = NVIDIA_NIM_MODELS[modelId] || modelId;

  const formattedMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  if (systemInstruction && systemInstruction.trim()) {
    formattedMessages.push({ role: "system", content: systemInstruction.trim() });
  }

  for (const m of messages) {
    let text = m.content || "";
    if (m.attachments && m.attachments.length > 0) {
      for (const att of m.attachments) {
        if (att.textContent) {
          text += `\n\n[Attached File: ${att.name || "document"}]\n\`\`\`\n${att.textContent.slice(0, 30000)}\n\`\`\``;
        }
      }
    }
    if (!text.trim()) text = "Hello";
    formattedMessages.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: text,
    });
  }

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: nvidiaModel,
      messages: formattedMessages,
      temperature,
      top_p: 0.95,
      max_tokens: 4096,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(errJson?.error?.message || `NVIDIA NIM API error: ${response.status}`);
  }

  if (!response.body) throw new Error("No stream received from NVIDIA NIM.");

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
      if (!trimmed.startsWith("data:")) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, "");
      if (!jsonStr || jsonStr === "[DONE]") continue;

      try {
        const data = JSON.parse(jsonStr);
        const chunk = data.choices?.[0]?.delta?.content || "";
        if (chunk) {
          fullText += chunk;
          onChunk(chunk);
        }
      } catch {}
    }
  }

  return { fullText, sources: [] };
}
