import { Message, GroundingSource } from "../types";

export interface GroqChatParams {
  messages: Message[];
  modelId?: string;
  systemInstruction?: string;
  temperature?: number;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

export function getGroqApiKey(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("shawezgpt_groq_api_key");
    if (custom && custom.trim()) return custom.trim();
  }
  return "";
}

/**
 * Streams response from Groq Cloud API (500+ tokens/sec ultra speed)
 */
export async function streamGroq({
  messages,
  modelId = "llama-3.3-70b-versatile",
  systemInstruction,
  temperature = 0.7,
  onChunk,
  signal,
}: GroqChatParams): Promise<{ fullText: string; sources: GroundingSource[] }> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error("No Groq API Key configured. Please add it in Settings -> API Keys.");
  }

  const groqModel =
    modelId === "deepseek-r1"
      ? "deepseek-r1-distill-llama-70b"
      : modelId === "qwen-2.5-coder"
      ? "qwen-2.5-coder-32b"
      : "llama-3.3-70b-versatile";

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

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: groqModel,
      messages: formattedMessages,
      temperature,
      max_tokens: 8192,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(errJson?.error?.message || `Groq API error: ${response.status}`);
  }

  if (!response.body) throw new Error("No stream received from Groq.");

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
