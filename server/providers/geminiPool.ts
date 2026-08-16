import { GoogleGenAI } from "@google/genai";

export interface KeyTelemetry {
  id: string;
  index: number;
  maskedKey: string;
  status: "healthy" | "cooling_down" | "invalid";
  cooldownUntil: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastUsedAt: number;
  lastError?: string;
}

export interface PoolStats {
  totalKeys: number;
  healthyKeys: number;
  coolingDownKeys: number;
  keys: KeyTelemetry[];
  activeKeyIndex: number;
}

export class GeminiKeyPool {
  private keys: string[] = [];
  private clients: Map<string, GoogleGenAI> = new Map();
  private telemetry: Map<string, KeyTelemetry> = new Map();
  private currentIndex: number = 0;

  constructor() {
    this.refreshKeys();
  }

  /**
   * Reload keys from environment variables
   */
  public refreshKeys(): void {
    const rawKeys: string[] = [];

    // 1. Check comma-separated GEMINI_API_KEYS
    if (process.env.GEMINI_API_KEYS) {
      const split = process.env.GEMINI_API_KEYS.split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0 && !k.startsWith("MY_GEMINI"));
      rawKeys.push(...split);
    }

    // 2. Check numbered keys: GEMINI_API_KEY, GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3...
    const individualNames = [
      "GEMINI_API_KEY",
      "GEMINI_API_KEY_1",
      "GEMINI_API_KEY_2",
      "GEMINI_API_KEY_3",
      "GEMINI_API_KEY_4",
      "GEMINI_API_KEY_5",
    ];

    for (const name of individualNames) {
      const val = process.env[name];
      if (val && typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed.length > 0 && !trimmed.startsWith("MY_GEMINI") && !rawKeys.includes(trimmed)) {
          rawKeys.push(trimmed);
        }
      }
    }

    // 3. Check GEMINI.TXT or gemini.txt or keys.txt file in project root
    try {
      const fs = require("fs");
      const path = require("path");
      const txtCandidates = [
        "GEMINI-API.TXT",
        "gemini-api.txt",
        "GEMINI.TXT",
        "gemini.txt",
        "keys.txt",
        "API.TXT",
        "api.txt",
      ];
      for (const fname of txtCandidates) {
        const fullPath = path.resolve(process.cwd(), fname);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf-8");
          const lines = content
            .split(/[\r\n]+/)
            .map((line: string) => {
              let clean = line.trim();
              clean = clean.replace(/^[0-9\.\s\-_:]*(API\s*(KEY|KYE)?|GEMINI_API_KEY[0-9]*|KEY[0-9]*)\s*[:=]?\s*/i, "").trim();
              return clean;
            })
            .filter((k: string) => k.length > 15 && !k.startsWith("#") && !k.startsWith("MY_GEMINI") && !k.startsWith("//"));
          for (const key of lines) {
            if (!rawKeys.includes(key)) {
              rawKeys.push(key);
            }
          }
        }
      }
    } catch {}

    this.keys = rawKeys;

    // Initialize clients and telemetry for each key
    this.keys.forEach((key, idx) => {
      if (!this.clients.has(key)) {
        this.clients.set(
          key,
          new GoogleGenAI({
            apiKey: key,
            httpOptions: {
              headers: {
                "User-Agent": "shawezgpt-enterprise",
              },
            },
          })
        );
      }

      if (!this.telemetry.has(key)) {
        const masked = this.maskKey(key);
        this.telemetry.set(key, {
          id: `gemini-key-${idx + 1}`,
          index: idx,
          maskedKey: masked,
          status: "healthy",
          cooldownUntil: 0,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          lastUsedAt: 0,
        });
      }
    });
  }

  private maskKey(key: string): string {
    if (key.length <= 10) return "••••••••";
    const prefix = key.slice(0, 6);
    const suffix = key.slice(-4);
    return `${prefix}...${suffix}`;
  }

  public getKeysCount(): number {
    return this.keys.length;
  }

  /**
   * Returns current pool health and stats
   */
  public getPoolStats(): PoolStats {
    const now = Date.now();
    const keyList: KeyTelemetry[] = [];
    let healthyCount = 0;
    let coolingCount = 0;

    this.keys.forEach((key, idx) => {
      let t = this.telemetry.get(key);
      if (!t) {
        t = {
          id: `gemini-key-${idx + 1}`,
          index: idx,
          maskedKey: this.maskKey(key),
          status: "healthy",
          cooldownUntil: 0,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          lastUsedAt: 0,
        };
        this.telemetry.set(key, t);
      }

      // Check if cooldown expired
      if (t.status === "cooling_down" && now > t.cooldownUntil) {
        t.status = "healthy";
      }

      if (t.status === "healthy") {
        healthyCount++;
      } else if (t.status === "cooling_down") {
        coolingCount++;
      }

      keyList.push({ ...t });
    });

    return {
      totalKeys: this.keys.length,
      healthyKeys: healthyCount,
      coolingDownKeys: coolingCount,
      keys: keyList,
      activeKeyIndex: this.currentIndex,
    };
  }

  /**
   * Helper to check if an error is quota/rate limit or high-demand related
   */
  public isQuotaOrOverloadError(err: any): { isQuota: boolean; isOverload: boolean; message: string } {
    const msg = err?.message || String(err || "");
    const lower = msg.toLowerCase();

    const isQuota =
      lower.includes("429") ||
      lower.includes("resource_exhausted") ||
      lower.includes("quota exceeded") ||
      lower.includes("rate limit") ||
      lower.includes("exhausted") ||
      lower.includes("too many requests");

    const isOverload =
      lower.includes("503") ||
      lower.includes("unavailable") ||
      lower.includes("high demand") ||
      lower.includes("service unavailable") ||
      lower.includes("temporarily overloaded");

    return { isQuota, isOverload, message: msg };
  }

  /**
   * Marks a key into cooldown
   */
  private markKeyCooldown(key: string, durationMs: number, reason: string): void {
    const t = this.telemetry.get(key);
    if (t) {
      t.status = "cooling_down";
      t.cooldownUntil = Date.now() + durationMs;
      t.failedRequests++;
      t.lastError = reason;
    }
  }

  private markKeySuccess(key: string): void {
    const t = this.telemetry.get(key);
    if (t) {
      t.status = "healthy";
      t.successfulRequests++;
      t.lastUsedAt = Date.now();
    }
  }

  /**
   * Get sorted list of key candidates prioritizing healthy keys
   */
  private getKeyCandidates(): string[] {
    const now = Date.now();
    const healthy: string[] = [];
    const cooling: string[] = [];

    // Order starting from currentIndex
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      const key = this.keys[idx];
      const t = this.telemetry.get(key);

      if (!t || t.status === "healthy" || now > t.cooldownUntil) {
        if (t) t.status = "healthy";
        healthy.push(key);
      } else {
        cooling.push(key);
      }
    }

    return [...healthy, ...cooling];
  }

  /**
   * Executes streaming chat with automatic key rotation and model fallback
   */
  public async generateContentStream(
    requestedModel: string,
    contents: any,
    config: any
  ): Promise<{
    responseStream: any;
    modelUsed: string;
    keyId: string;
    maskedKey: string;
  }> {
    if (this.keys.length === 0) {
      throw new Error("No Gemini API Keys configured. Please set GEMINI_API_KEY, GEMINI_API_KEY_2, or GEMINI_API_KEY_3 in .env");
    }

    const fallbackList: string[] = [];
    if (requestedModel === "gemini-3.7-flash") {
      fallbackList.push("gemini-2.5-flash", "gemini-3.1-flash-lite");
    } else if (requestedModel === "gemini-3.1-pro-preview") {
      fallbackList.push("gemini-2.5-pro", "gemini-3.7-flash");
    } else if (requestedModel === "gemini-3.1-flash-lite") {
      fallbackList.push("gemini-2.5-flash");
    }

    const modelsToTry = [requestedModel, ...fallbackList];
    const keyCandidates = this.getKeyCandidates();
    let lastError: any = null;

    // Try keys first, then fallback models
    for (let k = 0; k < keyCandidates.length; k++) {
      const currentKey = keyCandidates[k];
      const client = this.clients.get(currentKey);
      const tele = this.telemetry.get(currentKey);
      if (!client || !tele) continue;

      tele.totalRequests++;
      this.currentIndex = tele.index;

      for (let m = 0; m < modelsToTry.length; m++) {
        const currentModel = modelsToTry[m];
        try {
          const responseStream = await client.models.generateContentStream({
            model: currentModel,
            contents,
            config,
          });

          this.markKeySuccess(currentKey);
          return {
            responseStream,
            modelUsed: currentModel,
            keyId: tele.id,
            maskedKey: tele.maskedKey,
          };
        } catch (err: any) {
          lastError = err;
          const { isQuota, isOverload, message } = this.isQuotaOrOverloadError(err);

          if (isQuota) {
            console.warn(`[GeminiPool] Key ${tele.id} (${tele.maskedKey}) hit quota/rate limit: ${message}. Rotating to next API key...`);
            this.markKeyCooldown(currentKey, 60 * 1000, "Quota/Rate Limit Reached (429)");
            // Break inner model loop to switch key immediately
            break;
          } else if (isOverload) {
            console.warn(`[GeminiPool] Model ${currentModel} busy (503), attempting fallback...`);
            if (m === modelsToTry.length - 1) {
              this.markKeyCooldown(currentKey, 15 * 1000, "Model Temporarily Overloaded (503)");
            } else {
              await new Promise((r) => setTimeout(r, 300));
            }
          } else {
            // Other error (e.g. invalid request format or non-retriable)
            if (k === keyCandidates.length - 1 && m === modelsToTry.length - 1) {
              throw err;
            }
          }
        }
      }
    }

    throw lastError || new Error("All Gemini API keys in the pool failed to fulfill the request.");
  }

  /**
   * Executes non-streaming content generation with automatic key failover
   */
  public async generateContent(
    requestedModel: string,
    contents: any,
    config?: any
  ): Promise<{
    text?: string;
    modelUsed: string;
    keyId: string;
  }> {
    if (this.keys.length === 0) {
      throw new Error("No Gemini API Keys configured.");
    }

    const keyCandidates = this.getKeyCandidates();
    let lastError: any = null;

    for (let k = 0; k < keyCandidates.length; k++) {
      const currentKey = keyCandidates[k];
      const client = this.clients.get(currentKey);
      const tele = this.telemetry.get(currentKey);
      if (!client || !tele) continue;

      tele.totalRequests++;
      this.currentIndex = tele.index;

      try {
        const response = await client.models.generateContent({
          model: requestedModel,
          contents,
          config,
        });

        this.markKeySuccess(currentKey);
        return {
          text: response.text,
          modelUsed: requestedModel,
          keyId: tele.id,
        };
      } catch (err: any) {
        lastError = err;
        const { isQuota, isOverload } = this.isQuotaOrOverloadError(err);
        if (isQuota) {
          console.warn(`[GeminiPool] Key ${tele.id} quota exhausted. Rotating...`);
          this.markKeyCooldown(currentKey, 60 * 1000, "Quota Reached");
        } else if (isOverload) {
          this.markKeyCooldown(currentKey, 15 * 1000, "Model Busy");
        }
      }
    }

    throw lastError || new Error("Failed to generate content with Gemini key pool.");
  }

  /**
   * Direct client access fallback
   */
  public getPrimaryClient(): GoogleGenAI {
    if (this.keys.length === 0) {
      const dummy = process.env.GEMINI_API_KEY || "missing";
      return new GoogleGenAI({ apiKey: dummy });
    }
    const key = this.keys[this.currentIndex % this.keys.length];
    return this.clients.get(key)!;
  }
}

// Global Singleton Pool Instance
let globalPool: GeminiKeyPool | null = null;

export function getGeminiKeyPool(): GeminiKeyPool {
  if (!globalPool) {
    globalPool = new GeminiKeyPool();
  }
  return globalPool;
}
