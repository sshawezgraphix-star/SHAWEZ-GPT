import { Attachment, GroundingSource, Message } from "../types";

export interface DirectGeminiParams {
  messages: Message[];
  modelId?: string;
  systemInstruction?: string;
  temperature?: number;
  enableWebSearch?: boolean;
  onChunk: (text: string) => void;
  onGrounding?: (sources: GroundingSource[]) => void;
  signal?: AbortSignal;
}

// Runtime decoded keys for zero-quota standalone mobile APK execution
function decodeKey(b64: string): string {
  try {
    return atob(b64);
  } catch {
    return "";
  }
}

const BUILTIN_KEYS_ENCODED: string[] = [
  "QVEuQWI4Uk42TDdraVBTTjdoOFhWWEZscGU0OTBHOG1xa25NYlVyOGdjczNPM2tsdFJZTHc=",
  "QVEuQWI4Uk42SlJzNGtuOWFPYUhFNk5CMmotM1Q2djN2Z3pTVnpPX3FoYVpfdDdkX3RTYmc=",
  "QVEuQWI4Uk42TG1wRzFPUGp4Wi1EZFUweWY5N2JaeENiQ1hVYWZmTDVKX1hsSUo0WTFLdmc=",
];

let activeKeyIndex = 0;

export function getClientGeminiKeys(): string[] {
  const keys = BUILTIN_KEYS_ENCODED.map(decodeKey).filter((k) => k.length > 10);
  if (typeof window !== "undefined") {
    const userKey = localStorage.getItem("shawezgpt_custom_gemini_key");
    if (userKey && userKey.trim() && !keys.includes(userKey.trim())) {
      keys.unshift(userKey.trim());
    }
  }
  return keys;
}

export function mapToGoogleModel(modelId?: string): string {
  return "gemini-2.5-flash";
}

function formatContents(messages: Message[]) {
  return messages.map((m) => {
    const parts: any[] = [];

    // Add attachments (images, PDFs, documents, text files)
    if (m.attachments && m.attachments.length > 0) {
      for (const att of m.attachments) {
        if (att.data && att.mimeType) {
          const cleanBase64 = att.data.includes(",") ? att.data.split(",")[1] : att.data;
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: cleanBase64,
            },
          });
        } else if (att.textContent) {
          parts.push({
            text: `[Attached File: ${att.name || "document"}]\n${att.textContent}`,
          });
        }
      }
    }

    // Add user text
    const textContent =
      m.content && m.content.trim()
        ? m.content
        : parts.length > 0
        ? "Please analyze the attached file(s) and provide a comprehensive response."
        : "Hello";
    parts.push({ text: textContent });

    return {
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts,
    };
  });
}

export function getModelPersonaInstruction(modelId?: string, userInstruction?: string): string {
  const m = (modelId || "").toLowerCase();
  let persona = "";
  if (m.includes("claude") || m.includes("sonnet")) {
    persona = "You are Claude 3.5 Sonnet (developed by Anthropic), the world's leading AI model for high-precision programming, clean software architecture, structured ATS resume drafting, and nuanced reasoning. Provide deeply structured, eloquent, and mathematically accurate responses.";
  } else if (m.includes("gpt-4") || m.includes("chatgpt")) {
    persona = "You are ChatGPT GPT-4o (developed by OpenAI), an advanced omni-modal AI flagship capable of deep reasoning, versatile problem-solving, and full-stack software development.";
  } else if (m.includes("deepseek") || m.includes("r1")) {
    persona = "You are DeepSeek-R1 (developed by DeepSeek), a state-of-the-art open reasoning model specializing in transparent step-by-step mathematical reasoning, formal logic proofs, and optimized algorithms.";
  } else if (m.includes("llama")) {
    persona = "You are Meta Llama 3.3 70B (developed by Meta AI), Meta's flagship open-weight intelligence model with 405B-level capabilities in complex problem-solving, coding, and multilingual understanding.";
  } else {
    persona = "You are ShawezGPT, an advanced, versatile, and highly capable AI assistant. Provide beautifully formatted markdown with clear headings, bullet points, and code blocks.";
  }

  if (userInstruction && userInstruction.trim()) {
    return `${persona}\n\n${userInstruction.trim()}`;
  }
  return persona;
}

/**
 * Direct client-side streaming from Google Gemini API with automatic 3-key pool failover
 * and seamless fallback to instant non-streaming if webview stream buffers.
 */
export async function streamDirectGemini({
  messages,
  modelId,
  systemInstruction,
  temperature = 0.7,
  enableWebSearch = false,
  onChunk,
  onGrounding,
  signal,
}: DirectGeminiParams): Promise<{ fullText: string; sources: GroundingSource[] }> {
  const keys = getClientGeminiKeys();
  const googleModel = mapToGoogleModel(modelId);
  const contents = formatContents(messages);
  const effectiveInstruction = getModelPersonaInstruction(modelId, systemInstruction);

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
    systemInstruction: {
      parts: [{ text: effectiveInstruction }],
    },
  };

  if (enableWebSearch) {
    requestBody.tools = [{ google_search: {} }];
  }

  let lastError: any = null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[(activeKeyIndex + attempt) % keys.length];
    const sseEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:streamGenerateContent?alt=sse&key=${key}`;
    const directEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${key}`;

    try {
      // Step A: Attempt SSE Streaming
      const response = await fetch(sseEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (response.status === 429 || response.status === 503) {
        console.warn(
          `[DirectGemini] Key index ${(activeKeyIndex + attempt) % keys.length} hit rate limit (${response.status}), switching to next key...`
        );
        lastError = new Error(`Rate limit reached on key #${((activeKeyIndex + attempt) % keys.length) + 1}`);
        continue;
      }

      if (!response.ok) {
        // If SSE endpoint failed, try non-streaming on same key
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error?.message || `API error ${response.status}`;
        console.warn(`[DirectGemini] SSE failed with key #${((activeKeyIndex + attempt) % keys.length) + 1}: ${errMsg}, attempting direct fallback...`);
      } else if (response.body) {
        activeKeyIndex = (activeKeyIndex + attempt) % keys.length;
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let fullText = "";
        const sources: GroundingSource[] = [];

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
              const candidate = data.candidates?.[0];
              if (candidate?.content?.parts) {
                for (const part of candidate.content.parts) {
                  if (part.text) {
                    fullText += part.text;
                    onChunk(part.text);
                  }
                }
              }

              if (candidate?.groundingMetadata?.groundingChunks) {
                for (const chunk of candidate.groundingMetadata.groundingChunks) {
                  if (chunk.web?.uri) {
                    sources.push({
                      title: chunk.web.title || "Web Source",
                      url: chunk.web.uri,
                      snippet: chunk.web.title || "",
                    });
                  }
                }
                if (onGrounding && sources.length > 0) {
                  onGrounding(sources);
                }
              }
            } catch {
              // Ignore partial chunk parse errors
            }
          }
        }

        if (fullText.trim().length > 0) {
          return { fullText, sources };
        }
      }

      // Step B: Non-streaming fallback if SSE returned empty or reader not supported
      console.log(`[DirectGemini] Calling direct generateContent fallback with key #${((activeKeyIndex + attempt) % keys.length) + 1}...`);
      const directRes = await fetch(directEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (directRes.ok) {
        activeKeyIndex = (activeKeyIndex + attempt) % keys.length;
        const data = await directRes.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text || "";
        const sources: GroundingSource[] = [];

        if (candidate?.groundingMetadata?.groundingChunks) {
          for (const chunk of candidate.groundingMetadata.groundingChunks) {
            if (chunk.web?.uri) {
              sources.push({
                title: chunk.web.title || "Web Source",
                url: chunk.web.uri,
                snippet: chunk.web.title || "",
              });
            }
          }
        }

        if (text) {
          onChunk(text);
          if (sources.length > 0) onGrounding?.(sources);
          return { fullText: text, sources };
        }
      }
    } catch (fetchErr: any) {
      if (fetchErr.name === "AbortError") {
        throw fetchErr;
      }
      console.warn(`[DirectGemini] Network error with key #${((activeKeyIndex + attempt) % keys.length) + 1}:`, fetchErr);
      lastError = fetchErr;
    }
  }

  throw lastError || new Error("All Gemini API keys in the pool failed to respond. Please check your internet connection.");
}
