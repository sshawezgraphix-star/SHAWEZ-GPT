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
    persona = "You are Claude 3.5 Sonnet, an elite AI model known for world-class coding, system architecture, deep reasoning, and precise problem solving. Provide elegant, structured, and accurate responses.";
  } else if (m.includes("gpt-4") || m.includes("chatgpt")) {
    persona = "You are ChatGPT GPT-4o, a highly capable and intelligent AI flagship known for versatile reasoning, full-stack programming, and clear, human-like explanations.";
  } else if (m.includes("deepseek") || m.includes("r1")) {
    persona = "You are DeepSeek-R1, an advanced reasoning AI specializing in transparent step-by-step logic, mathematical proofs, and optimized algorithms.";
  } else if (m.includes("llama")) {
    persona = "You are Meta Llama 3.3 70B, a powerful flagship open model known for high performance in coding, reasoning, and multilingual conversation.";
  } else {
    persona = "You are ShawezGPT, an ultra-powerful, friendly, and expert AI assistant. Deliver clear, accurate, and beautifully structured responses with markdown headings, bullet points, and clean code blocks.";
  }

  const creatorRule = "CRITICAL IDENTITY RULE: You are ShawezGPT, created and developed by Shawez (Shawez AI). If and ONLY IF the user explicitly asks who created or made you (e.g., 'who made you', 'kisne banaya', 'who is your creator'), state clearly and proudly that you were created and developed by Shawez (Shawez AI). On all other questions, answer the user's prompt directly, naturally, and intelligently in the user's chosen language (Hindi, Hinglish, or English) without introducing yourself repeatedly.\n\nAPP INSTALLATION & DOWNLOAD GUIDE: If the user asks how to download, install, or run ShawezGPT (e.g., 'app kaise install kare', 'download kaise kare', 'how to install apk'):\n1. 📱 **Android APK**: Download the latest `ShawezGPT.apk` from [GitHub Releases](https://github.com/sshawezgraphix-star/SHAWEZ-GPT/releases/latest). Enable 'Install Unknown Apps' in phone settings and tap Install.\n2. 🌐 **Web App (PWA / Mobile Shortcut)**: Open ShawezGPT in Chrome or Safari, tap the 3 dots (or Share button) and select 'Add to Home screen' (Install App).\n3. 💻 **PC / Windows Setup**: Clone repo from GitHub `https://github.com/sshawezgraphix-star/SHAWEZ-GPT`, run `npm install`, then `npm run build` and `npm start`, and open `http://localhost:3000`.\nAlways provide these steps in friendly, clear Hindi/Hinglish/English as requested!";

  if (userInstruction && userInstruction.trim()) {
    return `${creatorRule}\n\n${persona}\n\n${userInstruction.trim()}`;
  }
  return `${creatorRule}\n\n${persona}`;
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

  // Client-Side Emergency Fallback to Pollinations.ai (100% Free Unlimited, No Key)
  console.warn("[DirectGemini] All Gemini keys exhausted. Attempting Pollinations Free Engine fallback...");
  try {
    onChunk("> ⚡ *Shawez Mobile Engine: Switching to Unlimited Free AI Mode...*\n\n");
    const pollMessages = messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content || "Hello",
    }));

    if (effectiveInstruction) {
      pollMessages.unshift({ role: "system" as any, content: effectiveInstruction });
    }

    const pollRes = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: pollMessages,
        stream: false,
        temperature,
      }),
      signal,
    });

    if (pollRes.ok) {
      const raw = await pollRes.text();
      let pollText = "";
      try {
        const pollData = JSON.parse(raw);
        pollText = pollData.choices?.[0]?.message?.content || pollData.text || raw;
      } catch {
        pollText = raw;
      }
      if (pollText && pollText.trim()) {
        onChunk(pollText);
        return { fullText: pollText, sources: [] };
      }
    }
  } catch (pollErr: any) {
    if (pollErr.name === "AbortError") throw pollErr;
    console.error("[DirectGemini] Pollinations fallback failed:", pollErr);
  }

  throw lastError || new Error("All Gemini API keys in the pool failed to respond. Please check your internet connection.");
}
