/**
 * pollinationsProvider.ts
 *
 * 100% FREE, UNLIMITED, NO-KEY AI text generation via Pollinations.ai
 * Used as the ultimate fallback when ALL Gemini keys are exhausted/rate-limited.
 *
 * Features:
 *  - No API key needed (completely free)
 *  - No rate limits
 *  - Supports streaming
 *  - Multiple model options
 */

export interface PollinationsStreamParams {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

// Available free models on Pollinations
export const POLLINATIONS_MODELS = [
  "openai",          // GPT-4o equivalent
  "openai-large",    // GPT-4o Large
  "mistral",         // Mistral Large
  "claude-hybridspace", // Claude variant
  "deepseek",        // DeepSeek R1
  "qwen-coder",      // Qwen2.5 Coder
] as const;

/**
 * Stream text from Pollinations.ai — 100% free, no key, unlimited
 */
export async function streamPollinations({
  messages,
  model = "openai",
  systemInstruction,
  temperature = 0.7,
  onChunk,
  signal,
}: PollinationsStreamParams): Promise<{ fullText: string }> {
  // Build message array with optional system instruction
  const formattedMessages: Array<{ role: string; content: string }> = [];

  if (systemInstruction && systemInstruction.trim()) {
    formattedMessages.push({ role: "system", content: systemInstruction.trim() });
  }

  for (const m of messages) {
    formattedMessages.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content || "Hello",
    });
  }

  // Try each model in priority order
  const modelsToTry = [model, ...POLLINATIONS_MODELS.filter((m) => m !== model)];

  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    try {
      console.log(`[Pollinations] Attempting free unlimited model: ${currentModel}`);

      const response = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify({
          model: currentModel,
          messages: formattedMessages,
          stream: true,
          temperature,
          seed: Math.floor(Math.random() * 100000),
        }),
        signal,
      });

      if (!response.ok) {
        console.warn(`[Pollinations] Model ${currentModel} returned ${response.status}, trying next...`);
        lastError = new Error(`Pollinations HTTP ${response.status} for model ${currentModel}`);
        continue;
      }

      if (!response.body) {
        lastError = new Error(`No response body from Pollinations model ${currentModel}`);
        continue;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
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
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const rawData = trimmed.replace(/^data:\s*/, "");
          if (rawData === "[DONE]") continue;

          try {
            const data = JSON.parse(rawData);
            const chunkText =
              data.choices?.[0]?.delta?.content ||
              data.choices?.[0]?.text ||
              data.text ||
              "";

            if (chunkText) {
              fullText += chunkText;
              onChunk(chunkText);
            }
          } catch {
            // Partial JSON — skip
          }
        }
      }

      if (fullText.trim().length > 0) {
        console.log(`[Pollinations] ✅ Success with model: ${currentModel} (${fullText.length} chars)`);
        return { fullText };
      }

      lastError = new Error(`Empty response from Pollinations model ${currentModel}`);
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
      console.warn(`[Pollinations] Model ${currentModel} failed: ${err?.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error("All Pollinations models failed to respond.");
}

/**
 * Non-streaming fallback — simple POST to Pollinations
 */
export async function generatePollinations({
  messages,
  model = "openai",
  systemInstruction,
  temperature = 0.7,
}: Omit<PollinationsStreamParams, "onChunk">): Promise<string> {
  const formattedMessages: Array<{ role: string; content: string }> = [];

  if (systemInstruction && systemInstruction.trim()) {
    formattedMessages.push({ role: "system", content: systemInstruction.trim() });
  }

  for (const m of messages) {
    formattedMessages.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content || "Hello",
    });
  }

  const response = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      stream: false,
      temperature,
    }),
  });

  if (!response.ok) throw new Error(`Pollinations HTTP ${response.status}`);

  const data = await response.json();
  return data.choices?.[0]?.message?.content || data.text || "";
}
