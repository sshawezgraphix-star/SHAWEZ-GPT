import http from "http";

export interface OllamaModelInfo {
  name: string;
  model: string;
  size: number;
  digest: string;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
  modified_at?: string;
}

export interface OllamaStatus {
  isConnected: boolean;
  baseUrl: string;
  models: OllamaModelInfo[];
  defaultModel?: string;
  error?: string;
  version?: string;
}

export class OllamaProvider {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, "");
  }

  /**
   * Check connection to Ollama and get installed models
   */
  public async getStatus(): Promise<OllamaStatus> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          isConnected: false,
          baseUrl: this.baseUrl,
          models: [],
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: any = await response.json();
      const models: OllamaModelInfo[] = Array.isArray(data?.models) ? data.models : [];

      // Also try to get Ollama version
      let version = "unknown";
      try {
        const vRes = await fetch(`${this.baseUrl}/api/version`);
        if (vRes.ok) {
          const vData: any = await vRes.json();
          version = vData?.version || "unknown";
        }
      } catch {}

      return {
        isConnected: true,
        baseUrl: this.baseUrl,
        models,
        defaultModel: models.length > 0 ? models[0].name : "llama3",
        version,
      };
    } catch (err: any) {
      return {
        isConnected: false,
        baseUrl: this.baseUrl,
        models: [],
        error: err?.message?.includes("aborted")
          ? "Connection timed out. Ensure Ollama is running locally."
          : `Ollama server offline: ${err?.message || "Not reachable"}`,
      };
    }
  }

  /**
   * Check if a given model id belongs to Ollama (starts with ollama: or exists in model names)
   */
  public static isOllamaModelId(modelId: string): boolean {
    if (!modelId) return false;
    const lower = modelId.toLowerCase();
    // Cloud models should not be routed to Ollama
    if (
      lower.startsWith("gemini") ||
      lower.startsWith("claude") ||
      lower.startsWith("gpt") ||
      lower === "llama-3.3-70b" ||
      lower === "llama-3.2-vision" ||
      lower === "deepseek-r1"
    ) {
      return false;
    }
    if (lower.startsWith("ollama:") || lower.startsWith("ollama/")) return true;
    if (lower.includes(":")) return true;
    if (lower === "mistral" || lower === "llama3" || lower === "qwen" || lower === "phi3" || lower === "codellama") return true;
    return false;
  }

  public static cleanModelName(modelId: string): string {
    return modelId.replace(/^ollama[:\/]/, "");
  }

  /**
   * Stream chat with Ollama using native /api/chat
   */
  public async streamChat(
    messages: Array<{ role: string; content: string; attachments?: any[] }>,
    modelName: string,
    options: {
      systemInstruction?: string;
      temperature?: number;
      signal?: AbortSignal;
      onChunk: (chunk: string) => void;
    }
  ): Promise<{ fullText: string; modelUsed: string }> {
    const cleanModel = OllamaProvider.cleanModelName(modelName);

    // Format messages for Ollama
    const ollamaMessages: Array<{ role: string; content: string; images?: string[] }> = [];

    if (options.systemInstruction && options.systemInstruction.trim()) {
      ollamaMessages.push({
        role: "system",
        content: options.systemInstruction.trim(),
      });
    }

    for (const msg of messages) {
      const role = msg.role === "assistant" || msg.role === "model" ? "assistant" : "user";
      const images: string[] = [];
      let messageContent = msg.content || "";

      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.mimeType?.startsWith("image/") && att.data) {
            images.push(att.data.replace(/^data:[^;]+;base64,/, ""));
          } else if (att.textContent) {
            messageContent += `\n\n[Attached File: ${att.name || "file"}]\n\`\`\`\n${att.textContent.slice(0, 50000)}\n\`\`\``;
          }
        }
      }

      if (!messageContent.trim() && images.length > 0) {
        messageContent = "Please describe and analyze the attached image.";
      }

      ollamaMessages.push({
        role,
        content: messageContent.trim() || "(empty message)",
        ...(images.length > 0 ? { images } : {}),
      });
    }

    const payload = JSON.stringify({
      model: cleanModel,
      messages: ollamaMessages,
      stream: true,
      keep_alive: "15m",
      options: {
        temperature: options.temperature ?? 0.7,
      },
    });

    const parsedUrl = new URL(`${this.baseUrl}/api/chat`);

    return new Promise<{ fullText: string; modelUsed: string }>((resolve, reject) => {
      const req = http.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || 11434,
          path: parsedUrl.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            let errBody = "";
            res.on("data", (chunk) => (errBody += chunk.toString()));
            res.on("end", () => {
              reject(new Error(`Ollama API error (${res.statusCode}): ${errBody || res.statusMessage}`));
            });
            return;
          }

          let fullText = "";
          let buffer = "";

          res.on("data", (chunk) => {
            buffer += chunk.toString("utf-8");
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                const chunkContent = parsed.message?.content || "";
                if (chunkContent) {
                  fullText += chunkContent;
                  options.onChunk(chunkContent);
                }
              } catch {}
            }
          });

          res.on("end", () => {
            if (buffer.trim()) {
              try {
                const parsed = JSON.parse(buffer);
                const chunkContent = parsed.message?.content || "";
                if (chunkContent) {
                  fullText += chunkContent;
                  options.onChunk(chunkContent);
                }
              } catch {}
            }
            resolve({ fullText, modelUsed: `ollama:${cleanModel}` });
          });
        }
      );

      if (options.signal) {
        options.signal.addEventListener("abort", () => {
          req.destroy(new Error("Aborted by client"));
        });
      }

      req.on("error", (err) => {
        reject(err);
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * Non-streaming text generation with Ollama
   */
  public async generateText(
    prompt: string,
    modelName: string,
    systemInstruction?: string
  ): Promise<string> {
    const cleanModel = OllamaProvider.cleanModelName(modelName);

    const messages: Array<{ role: string; content: string }> = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: cleanModel,
        messages,
        stream: false,
        options: { temperature: 0.5 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama generation error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.message?.content || "";
  }
}

// Global Singleton Instance
let globalOllama: OllamaProvider | null = null;

export function getOllamaProvider(): OllamaProvider {
  if (!globalOllama) {
    globalOllama = new OllamaProvider();
  }
  return globalOllama;
}
