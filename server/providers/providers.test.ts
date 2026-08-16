import { GeminiKeyPool } from "./geminiPool";
import { OllamaProvider } from "./ollama";

export async function runProvidersTestSuite(): Promise<{
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: Array<{ testName: string; passed: boolean; durationMs: number; error?: string }>;
}> {
  const startTime = Date.now();
  const results: Array<{ testName: string; passed: boolean; durationMs: number; error?: string }> = [];

  const runTest = async (name: string, fn: () => Promise<void> | void) => {
    const t0 = Date.now();
    try {
      await fn();
      results.push({ testName: name, passed: true, durationMs: Date.now() - t0 });
    } catch (err: any) {
      results.push({
        testName: name,
        passed: false,
        durationMs: Date.now() - t0,
        error: err?.message || String(err),
      });
    }
  };

  // Test 1: Gemini Pool Key Loading & Masking
  await runTest("GeminiKeyPool - Key parsing and masking", () => {
    const prevKey1 = process.env.GEMINI_API_KEY_1;
    const prevKey2 = process.env.GEMINI_API_KEY_2;
    const prevKey3 = process.env.GEMINI_API_KEY_3;

    try {
      process.env.GEMINI_API_KEY_1 = "AIzaSyDummyKeyAlpha1234567890";
      process.env.GEMINI_API_KEY_2 = "AIzaSyDummyKeyBeta1234567890";
      process.env.GEMINI_API_KEY_3 = "AIzaSyDummyKeyGamma1234567890";

      const pool = new GeminiKeyPool();
      const stats = pool.getPoolStats();

      if (stats.totalKeys < 3) {
        throw new Error(`Expected at least 3 keys, got ${stats.totalKeys}`);
      }

      const key1 = stats.keys.find((k) => k.maskedKey.includes("AIzaSy"));
      if (!key1) {
        throw new Error("Key masking failed to preserve prefix");
      }

      if (key1.status !== "healthy") {
        throw new Error(`Initial status should be healthy, got ${key1.status}`);
      }
    } finally {
      process.env.GEMINI_API_KEY_1 = prevKey1;
      process.env.GEMINI_API_KEY_2 = prevKey2;
      process.env.GEMINI_API_KEY_3 = prevKey3;
    }
  });

  // Test 2: Gemini Pool Quota Detection
  await runTest("GeminiKeyPool - Quota/429 error detection", () => {
    const pool = new GeminiKeyPool();

    const quotaErr1 = { message: "429 Too Many Requests: RESOURCE_EXHAUSTED" };
    const quotaErr2 = new Error("Quota exceeded for quota metric 'GenerateContent'");
    const overloadErr = { message: "503 The model is overloaded. Please try again later." };
    const normalErr = new Error("Invalid argument: prompt is required");

    const res1 = pool.isQuotaOrOverloadError(quotaErr1);
    const res2 = pool.isQuotaOrOverloadError(quotaErr2);
    const res3 = pool.isQuotaOrOverloadError(overloadErr);
    const res4 = pool.isQuotaOrOverloadError(normalErr);

    if (!res1.isQuota || res1.isOverload) throw new Error("Failed to detect 429 quota error");
    if (!res2.isQuota) throw new Error("Failed to detect quota exceeded error");
    if (!res3.isOverload || res3.isQuota) throw new Error("Failed to detect 503 overload error");
    if (res4.isQuota || res4.isOverload) throw new Error("Misidentified normal error as quota/overload");
  });

  // Test 3: Ollama Provider Model Identification & Cleaning
  await runTest("OllamaProvider - Model identification & cleaning", () => {
    if (!OllamaProvider.isOllamaModelId("ollama:llama3")) {
      throw new Error("Failed to identify 'ollama:llama3'");
    }
    if (!OllamaProvider.isOllamaModelId("deepseek-r1:7b")) {
      throw new Error("Failed to identify 'deepseek-r1:7b'");
    }
    if (!OllamaProvider.isOllamaModelId("mistral")) {
      throw new Error("Failed to identify 'mistral'");
    }
    if (OllamaProvider.isOllamaModelId("gemini-3.7-flash")) {
      throw new Error("Misidentified gemini-3.7-flash as Ollama model");
    }

    const clean = OllamaProvider.cleanModelName("ollama:llama3.2:1b");
    if (clean !== "llama3.2:1b") {
      throw new Error(`Expected 'llama3.2:1b', got '${clean}'`);
    }
  });

  // Test 4: Ollama Offline Graceful Handling
  await runTest("OllamaProvider - Graceful offline error handling", async () => {
    const provider = new OllamaProvider("http://127.0.0.1:59999"); // intentionally dead port
    const status = await provider.getStatus();

    if (status.isConnected !== false) {
      throw new Error("Expected isConnected to be false for dead port");
    }
    if (!status.error) {
      throw new Error("Expected error message to be set when offline");
    }
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    suiteName: "ShawezGPT Multi-Provider & Key Pool Test Suite",
    totalTests: results.length,
    passed,
    failed,
    durationMs: Date.now() - startTime,
    results,
  };
}
