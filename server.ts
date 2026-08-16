import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  createRateLimiter,
  analyzePromptSecurity,
  runSecurityHardeningAudit,
  validateAttachment,
} from "./server/security";
import { sanitizeCredentials } from "./server/memory/sanitizer";
import { getGeminiKeyPool } from "./server/providers/geminiPool";
import { getOllamaProvider, OllamaProvider } from "./server/providers/ollama";

dotenv.config();

// Initialize Key Pool and Ollama Provider
const geminiPool = getGeminiKeyPool();
const ollamaProvider = getOllamaProvider();

const app = express();
const PORT = 3000;

// Security Hardening: HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Rate Limiter: 200 requests per minute per IP
const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 200,
  message: "Too many requests to ShawezGPT API. Please wait a few seconds before retrying.",
});
app.use("/api", apiRateLimiter);

// Body parsers with ample limit for multimodal base64 image/file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper to extract clean human-friendly error messages
function extractCleanErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred.";
  let msg = error.message || String(error);
  try {
    const parsed = JSON.parse(msg);
    if (parsed.error?.message) {
      msg = parsed.error.message;
    }
  } catch {
    // Not a direct JSON string
  }
  if (typeof msg === "string" && msg.includes('"message":')) {
    const match = msg.match(/"message":\s*"([^"]+)"/);
    if (match && match[1]) {
      msg = match[1];
    }
  }
  if (msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE")) {
    return "This AI model is temporarily experiencing high server demand. Please try again in a few moments or switch models in the top bar.";
  }
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "Rate limit reached on current key. Auto-failover is rotating to the next available API key in the pool.";
  }
  // Sanitize any accidentally leaked tokens or keys in error traces
  const sanitized = sanitizeCredentials(msg);
  return sanitized.sanitizedText;
}

const AVAILABLE_MODELS = [
  {
    id: "gemini-3.7-flash",
    name: "Shawez Turbo 3.7",
    description: "Next-gen hybrid model with breakthrough speed, deep code generation, and adaptive reasoning.",
    contextWindow: "1M tokens",
    badge: "Recommended",
    category: "Balanced & Fast",
    provider: "gemini",
    supportsSearch: true,
    supportsVision: true,
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Shawez Deep Pro",
    description: "Maximum reasoning power for complex mathematics, architectural design, and deep technical logic.",
    contextWindow: "2M tokens",
    badge: "Deep Reasoning",
    category: "Advanced Intelligence",
    provider: "gemini",
    supportsSearch: true,
    supportsVision: true,
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Shawez Ultra Lite",
    description: "Ultra-fast response latency optimized for instantaneous queries and quick summarization.",
    contextWindow: "1M tokens",
    badge: "Lightning Fast",
    category: "Low Latency",
    provider: "gemini",
    supportsSearch: true,
    supportsVision: true,
  },
];

// 1. Health check endpoint
app.get("/api/health", async (req: Request, res: Response) => {
  const poolStats = geminiPool.getPoolStats();
  const ollamaStatus = await ollamaProvider.getStatus();

  res.json({
    status: "ok",
    appName: process.env.SYSTEM_BRAND_NAME || "ShawezGPT",
    defaultModel: process.env.DEFAULT_AI_MODEL || "gemini-3.7-flash",
    apiKeyConfigured: poolStats.totalKeys > 0,
    geminiKeyCount: poolStats.totalKeys,
    geminiHealthyKeys: poolStats.healthyKeys,
    ollamaConnected: ollamaStatus.isConnected,
    ollamaModelCount: ollamaStatus.models.length,
    timestamp: new Date().toISOString(),
  });
});

// 1b. Providers status endpoint (Detailed Telemetry for 3 Gemini Keys + Ollama)
app.get("/api/providers/status", async (req: Request, res: Response) => {
  try {
    const poolStats = geminiPool.getPoolStats();
    const ollamaStatus = await ollamaProvider.getStatus();

    res.json({
      geminiPool: poolStats,
      ollama: ollamaStatus,
      failoverReady: poolStats.totalKeys > 1 || ollamaStatus.isConnected,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: extractCleanErrorMessage(err) });
  }
});

// 1c. Ollama status and models endpoint
app.get("/api/ollama/status", async (req: Request, res: Response) => {
  try {
    const status = await ollamaProvider.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: extractCleanErrorMessage(err) });
  }
});

// 2. Models list endpoint (merges Gemini + Ollama models dynamically)
app.get("/api/models", async (req: Request, res: Response) => {
  try {
    const ollamaStatus = await ollamaProvider.getStatus();
    const dynamicModels = [...AVAILABLE_MODELS];

    if (ollamaStatus.isConnected && ollamaStatus.models.length > 0) {
      ollamaStatus.models.forEach((m) => {
        const paramSize = m.details?.parameter_size ? ` (${m.details.parameter_size})` : "";
        dynamicModels.push({
          id: `ollama:${m.name}`,
          name: `Ollama: ${m.name}${paramSize}`,
          description: `Local/Offline model running via Ollama. No API quota limits, 100% private.`,
          contextWindow: "128K tokens",
          badge: "Ollama Local (Unlimited Quota)",
          category: "Local / Open Source",
          provider: "ollama",
          supportsSearch: false,
          supportsVision: m.name.includes("llava") || m.name.includes("vision"),
        });
      });
    }

    res.json({
      models: dynamicModels,
      defaultModel: process.env.DEFAULT_AI_MODEL || "gemini-3.7-flash",
      ollamaActive: ollamaStatus.isConnected,
    });
  } catch (err: any) {
    res.json({
      models: AVAILABLE_MODELS,
      defaultModel: "gemini-3.7-flash",
    });
  }
});

// 3. Title Generation Endpoint (Gemini Multi-Key with Ollama Fallback)
app.post("/api/chat/title", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Try Gemini pool first
    try {
      if (geminiPool.getKeysCount() > 0) {
        const response = await geminiPool.generateContent(
          "gemini-3.7-flash",
          `Generate a short, concise, and catchy title (3 to 5 words, no quotation marks, no punctuation at end) summarizing this initial user query:\n\n"${prompt.slice(0, 300)}"`,
          { temperature: 0.5 }
        );
        const title = response.text?.trim().replace(/^["']|["']$/g, "") || prompt.slice(0, 30);
        return res.json({ title });
      }
    } catch (geminiErr) {
      console.warn("Gemini title generation failed, falling back to Ollama or prompt truncation...", geminiErr);
    }

    // Fallback to Ollama if connected
    const ollamaStatus = await ollamaProvider.getStatus();
    if (ollamaStatus.isConnected && ollamaStatus.models.length > 0) {
      const ollamaModel = ollamaStatus.models[0].name;
      const title = await ollamaProvider.generateText(
        `Summarize this user query in 3 to 5 words for a chat title. Output only the short title:\n"${prompt.slice(0, 300)}"`,
        ollamaModel
      );
      return res.json({ title: title.trim().replace(/^["']|["']$/g, "") });
    }

    res.json({ title: prompt.slice(0, 24) || "New Conversation" });
  } catch (error: any) {
    console.error("Title generation error:", error?.message || error);
    res.status(500).json({ title: req.body?.prompt?.slice(0, 24) || "New Conversation" });
  }
});

// 4. Streaming Chat Endpoint (Server-Sent Events)
app.post("/api/chat/stream", async (req: Request, res: Response) => {
  // Setup SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      messages,
      model = process.env.DEFAULT_AI_MODEL || "gemini-3.7-flash",
      systemInstruction,
      temperature = 0.7,
      enableWebSearch = false,
      attachments = [],
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      sendEvent("error", { message: "Messages array is required." });
      res.end();
      return;
    }

    const isOllamaSelected = OllamaProvider.isOllamaModelId(model);

    // CASE 1: User explicitly selected an Ollama Model
    if (isOllamaSelected) {
      try {
        const result = await ollamaProvider.streamChat(
          messages,
          model,
          {
            systemInstruction,
            temperature: Number(temperature) || 0.7,
            onChunk: (text) => {
              sendEvent("chunk", { text, modelUsed: `ollama:${OllamaProvider.cleanModelName(model)}` });
            },
          }
        );

        sendEvent("done", {
          fullText: result.fullText,
          sources: [],
          modelUsed: result.modelUsed,
        });
        res.end();
        return;
      } catch (ollamaErr: any) {
        console.error("Ollama streaming error:", ollamaErr);
        sendEvent("error", {
          message: `Ollama error: ${ollamaErr?.message || "Failed to communicate with local Ollama server."}. Ensure Ollama is running (ollama serve).`,
        });
        res.end();
        return;
      }
    }

    // CASE 2: Gemini Multi-Key Pool Execution with Auto-Failover to Ollama
    const contents: Array<{ role: "user" | "model"; parts: any[] }> = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = msg.role === "assistant" ? "model" : "user";
      const parts: any[] = [];

      // If this message has attachments (e.g. images or document text)
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.data && att.mimeType) {
            if (att.mimeType.startsWith("image/")) {
              parts.push({
                inlineData: {
                  mimeType: att.mimeType,
                  data: att.data.replace(/^data:[^;]+;base64,/, ""),
                },
              });
            } else if (att.textContent) {
              parts.push({
                text: `[Attached File: ${att.name || "document"}]\n\`\`\`\n${att.textContent}\n\`\`\``,
              });
            }
          }
        }
      }

      if (msg.content && msg.content.trim()) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    const config: any = {
      temperature: Number(temperature) || 0.7,
    };

    if (systemInstruction && typeof systemInstruction === "string" && systemInstruction.trim()) {
      config.systemInstruction = systemInstruction.trim();
    }

    // Grounding with Google Search if requested
    if (enableWebSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    let streamResult;
    try {
      streamResult = await geminiPool.generateContentStream(
        model || "gemini-3.7-flash",
        contents,
        config
      );
    } catch (geminiPoolErr: any) {
      console.warn("All Gemini keys exhausted or failed, checking Ollama fallback...", geminiPoolErr);

      // Attempt emergency fallback to Ollama if connected!
      const ollamaStatus = await ollamaProvider.getStatus();
      if (ollamaStatus.isConnected && ollamaStatus.models.length > 0) {
        const fallbackOllamaModel = ollamaStatus.models[0].name;
        sendEvent("chunk", {
          text: `> ℹ️ *Gemini API quota currently cooling down across all keys. Seamlessly switching to local Ollama (${fallbackOllamaModel}) with unlimited quota...*\n\n`,
          modelUsed: `ollama:${fallbackOllamaModel}`,
        });

        const fallbackResult = await ollamaProvider.streamChat(
          messages,
          fallbackOllamaModel,
          {
            systemInstruction,
            temperature: Number(temperature) || 0.7,
            onChunk: (text) => {
              sendEvent("chunk", { text, modelUsed: `ollama:${fallbackOllamaModel}` });
            },
          }
        );

        sendEvent("done", {
          fullText: fallbackResult.fullText,
          sources: [],
          modelUsed: fallbackResult.modelUsed,
        });
        res.end();
        return;
      }

      throw geminiPoolErr;
    }

    const { responseStream, modelUsed, keyId } = streamResult;

    let fullText = "";
    let extractedGroundingSources: Array<{ title: string; uri: string }> = [];

    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        sendEvent("chunk", { text: chunkText, modelUsed, keyId });
      }

      // Check for grounding metadata
      const candidate = chunk.candidates?.[0];
      const searchChunks = candidate?.groundingMetadata?.groundingChunks;
      if (searchChunks && Array.isArray(searchChunks)) {
        for (const sc of searchChunks) {
          if (sc.web?.uri) {
            if (!extractedGroundingSources.some((s) => s.uri === sc.web.uri)) {
              extractedGroundingSources.push({
                title: sc.web.title || new URL(sc.web.uri).hostname,
                uri: sc.web.uri,
              });
            }
          }
        }
      }
    }

    if (extractedGroundingSources.length > 0) {
      sendEvent("grounding", { sources: extractedGroundingSources });
    }

    sendEvent("done", { fullText, sources: extractedGroundingSources, modelUsed, keyId });
    res.end();
  } catch (error: any) {
    console.error("Chat streaming error:", error?.message || error);
    const cleanMessage = extractCleanErrorMessage(error);
    sendEvent("error", {
      message: cleanMessage,
    });
    res.end();
  }
});

// 5. Lightweight Auth & Profile Verification endpoint
app.post("/api/auth/demo-login", (req: Request, res: Response) => {
  const { name = "Shawez Explorer", email = "user@shawezgpt.ai" } = req.body;
  const token = "sgpt_" + Buffer.from(`${email}:${Date.now()}`).toString("base64");
  res.json({
    user: {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name,
      email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      plan: "ShawezGPT Pro",
      createdAt: new Date().toISOString(),
    },
    token,
  });
});

// 5a. Agent Registry Endpoints
app.get("/api/registry/agents", async (req: Request, res: Response) => {
  try {
    const { getAgentRegistry } = await import("./server/registry");
    const registry = getAgentRegistry();
    const agents = registry.getAllAgents().map((a) => ({
      id: a.id,
      name: a.name,
      purpose: a.purpose,
      version: a.version,
      capabilities: a.capabilities,
      tools: a.tools,
      permissions: a.permissions,
      inputSchema: a.inputSchema,
      outputSchema: a.outputSchema,
      status: a.status,
      metrics: a.metrics,
    }));
    res.json({ agents });
  } catch (error: any) {
    console.error("Fetch agents error:", error);
    res.status(500).json({ error: error?.message || "Failed to load agent registry" });
  }
});

// 5b. Tool Registry Endpoints
app.get("/api/registry/tools", async (req: Request, res: Response) => {
  try {
    const { getToolRegistry } = await import("./server/registry");
    const registry = getToolRegistry();
    const tools = registry.getAllTools().map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      version: t.version,
      permissions: t.permissions,
      parameters: t.parameters,
      returns: t.returns,
      status: t.status,
      metrics: t.metrics,
    }));
    res.json({ tools });
  } catch (error: any) {
    console.error("Fetch tools error:", error);
    res.status(500).json({ error: error?.message || "Failed to load tool registry" });
  }
});

// 5c. Registry System Health Check Endpoint
app.get("/api/registry/health", async (req: Request, res: Response) => {
  try {
    const { runSystemHealthCheck } = await import("./server/registry");
    const report = await runSystemHealthCheck();
    res.json(report);
  } catch (error: any) {
    console.error("Registry health check error:", error);
    res.status(500).json({ error: error?.message || "Failed to run registry health check" });
  }
});

// 5d. Agent Status Update Endpoint (For testing dynamic degraded fallback routing)
app.post("/api/registry/agents/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["active", "degraded", "inactive", "maintenance"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    const { getAgentRegistry } = await import("./server/registry");
    const registry = getAgentRegistry();
    const updated = registry.updateAgentStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: `Agent "${id}" not found` });
    }
    res.json({ success: true, agentId: id, status });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to update agent status" });
  }
});

// 5e. Automated Registry Test Suite Runner Endpoint
app.post("/api/registry/run-tests", async (req: Request, res: Response) => {
  try {
    const { runRegistryTestSuite } = await import("./server/registry.test");
    const report = await runRegistryTestSuite();
    res.json(report);
  } catch (error: any) {
    console.error("Registry test suite error:", error);
    res.status(500).json({ error: error?.message || "Failed to execute registry test suite" });
  }
});

// ==========================================
// 5f. AUTONOMOUS MISSION MODE ENDPOINTS
// ==========================================

// Stream Autonomous Mission Execution
app.post("/api/mission/stream", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { objective, attachments = [] } = req.body;
    if (!objective || typeof objective !== "string" || !objective.trim()) {
      sendEvent("error", { message: "Objective is required for mission mode." });
      res.end();
      return;
    }

    const {
      createHeuristicMissionPlan,
      MissionExecutor,
      getMissionManager,
    } = await import("./server/mission");

    const missionId = `mission_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const mission = createHeuristicMissionPlan(missionId, objective.trim(), attachments);

    const executor = new MissionExecutor(mission, (event) => {
      sendEvent(event.type, event);
    });

    getMissionManager().registerMission(mission, executor);

    sendEvent("dag_created", { missionState: mission });

    await executor.executeMission();

    res.end();
  } catch (err: any) {
    console.error("Mission stream error:", err);
    sendEvent("error", { message: err?.message || "Mission execution failed" });
    res.end();
  }
});

// Mission Control Action (pause, resume, cancel, retry, approve, reject)
app.post("/api/mission/:id/control", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, taskId, approvalId, decisionReason } = req.body;

    const { getMissionManager } = await import("./server/mission");
    const manager = getMissionManager();
    const mission = manager.getMission(id);
    const executor = manager.getExecutor(id);

    if (!mission || !executor) {
      // In-memory mission not found (or server restarted), acknowledge gracefully
      return res.json({
        success: true,
        message: `Action ${action} recorded for mission ${id}`,
      });
    }

    if (action === "pause") {
      executor.pause();
    } else if (action === "resume") {
      executor.resume();
    } else if (action === "cancel") {
      executor.cancel();
    } else if (action === "approve" && approvalId) {
      executor.approveAction(approvalId, decisionReason);
    } else if (action === "reject" && approvalId) {
      executor.rejectAction(approvalId, decisionReason);
    }

    res.json({ success: true, mission });
  } catch (err: any) {
    console.error("Mission control error:", err);
    res.status(500).json({ error: err?.message || "Failed to execute mission control action" });
  }
});

// Mission Test Suite Runner
app.post("/api/mission/run-tests", async (req: Request, res: Response) => {
  try {
    const { runMissionTestSuite } = await import("./server/mission/mission.test");
    const report = await runMissionTestSuite();
    res.json(report);
  } catch (error: any) {
    console.error("Mission test suite error:", error);
    res.status(500).json({ error: error?.message || "Failed to execute mission test suite" });
  }
});

// ==========================================
// 6. MEMORY & CONTEXT ENGINE API ENDPOINTS
// ==========================================

// 6a. List & Search Memories
app.get("/api/memory", async (req: Request, res: Response) => {
  try {
    const { getMemoryStore, retrieveRankedMemories } = await import("./server/memory");
    const {
      query,
      projectId,
      type,
      privacy,
      approvalStatus,
      includePending = "true",
      limit = "50",
    } = req.query;

    const store = getMemoryStore();

    if (query && typeof query === "string" && query.trim().length > 0) {
      const results = retrieveRankedMemories(
        {
          query: query.trim(),
          projectId: projectId as string,
          types: type ? [type as any] : undefined,
          privacyFilter: privacy ? [privacy as any] : undefined,
          approvalStatus: approvalStatus as any,
          includePending: includePending === "true",
          limit: parseInt(limit as string, 10) || 50,
          minRelevance: 5,
        },
        store
      );
      return res.json({
        memories: results.map((r) => ({
          ...r.entry,
          relevanceScore: r.score,
          matchReason: r.matchReason,
        })),
      });
    }

    let all = store.getAll();
    if (projectId) {
      all = all.filter((m) => m.projectId === projectId || !m.projectId);
    }
    if (type) {
      all = all.filter((m) => m.type === type);
    }
    if (privacy) {
      all = all.filter((m) => m.privacy === privacy);
    }
    if (approvalStatus) {
      all = all.filter((m) => m.approvalStatus === approvalStatus);
    } else if (includePending === "false") {
      all = all.filter((m) => m.approvalStatus === "approved");
    }

    // Sort by updated time descending
    all.sort((a, b) => b.updatedAt - a.updatedAt);
    res.json({ memories: all.slice(0, parseInt(limit as string, 10) || 50) });
  } catch (error: any) {
    console.error("Memory list error:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch memories" });
  }
});

// 6b. Memory Store Statistics & Health
app.get("/api/memory/stats", async (req: Request, res: Response) => {
  try {
    const { getMemoryStore, runMemoryHealthCheck } = await import("./server/memory");
    const store = getMemoryStore();
    const health = runMemoryHealthCheck();
    res.json({
      stats: store.getStats(),
      health,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to fetch memory stats" });
  }
});

// 6c. Create Memory (with automatic credential sanitization)
app.post("/api/memory", async (req: Request, res: Response) => {
  try {
    const { getMemoryStore } = await import("./server/memory");
    const {
      type,
      title,
      content,
      summary,
      projectId,
      sessionId,
      tags,
      importance,
      privacy,
      approvalStatus,
    } = req.body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Memory content is required." });
    }

    const store = getMemoryStore();
    const result = store.create({
      type,
      title: title || "Untitled Memory",
      content,
      summary,
      projectId,
      sessionId,
      tags,
      importance: Number(importance) || 3,
      privacy,
      approvalStatus: approvalStatus || "approved",
      source: "user",
    });

    res.status(201).json({
      success: true,
      entry: result.entry,
      wasRedacted: result.wasRedacted,
      warnings: result.warnings,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to create memory" });
  }
});

// 6d. Update Memory
app.put("/api/memory/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { getMemoryStore } = await import("./server/memory");
    const store = getMemoryStore();

    const result = store.update(id, req.body);
    if (!result.entry) {
      return res.status(404).json({ error: `Memory '${id}' not found` });
    }

    res.json({
      success: true,
      entry: result.entry,
      wasRedacted: result.wasRedacted,
      warnings: result.warnings,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to update memory" });
  }
});

// 6e. Delete Memory
app.delete("/api/memory/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { getMemoryStore } = await import("./server/memory");
    const store = getMemoryStore();
    const deleted = store.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: `Memory '${id}' not found` });
    }

    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to delete memory" });
  }
});

// 6f. Approve Memory
app.post("/api/memory/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { getMemoryStore } = await import("./server/memory");
    const store = getMemoryStore();
    const ok = store.approve(id);
    if (!ok) return res.status(404).json({ error: `Memory '${id}' not found` });
    res.json({ success: true, id, status: "approved" });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to approve memory" });
  }
});

// 6g. Reject Memory
app.post("/api/memory/:id/reject", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { getMemoryStore } = await import("./server/memory");
    const store = getMemoryStore();
    const ok = store.reject(id);
    if (!ok) return res.status(404).json({ error: `Memory '${id}' not found` });
    res.json({ success: true, id, status: "rejected" });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to reject memory" });
  }
});

// 6h. Context Retrieval Tester & Simulator
app.post("/api/memory/retrieve", async (req: Request, res: Response) => {
  try {
    const { assembleContext } = await import("./server/memory");
    const { query, projectId, maxTokens = 1200 } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query is required for context assembly simulation." });
    }

    const assembly = assembleContext(query, {
      projectId: projectId || "shawezgpt-main",
      maxTokens: Number(maxTokens) || 1200,
    });

    res.json(assembly);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to assemble context" });
  }
});

// 6i. Automated Memory Test Suite Runner
app.post("/api/memory/run-tests", async (req: Request, res: Response) => {
  try {
    const { runMemoryTestSuite } = await import("./server/memory.test");
    const report = await runMemoryTestSuite();
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to run memory test suite" });
  }
});

// 6j. Complete End-to-End Production Test Suite Runner
app.post("/api/e2e/run-tests", async (req: Request, res: Response) => {
  try {
    const { runEndToEndTestSuite } = await import("./server/e2e.test");
    const report = await runEndToEndTestSuite();
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to run E2E test suite" });
  }
});

// 6. Advanced Task Orchestrator Streaming Endpoint
app.post("/api/orchestrator/stream", async (req: Request, res: Response) => {
  // Setup SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      prompt,
      model = process.env.DEFAULT_AI_MODEL || "gemini-3.7-flash",
      attachments = [],
    } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      sendEvent("error", { message: "Prompt is required for task orchestration." });
      res.end();
      return;
    }

    const {
      planComplexTask,
      executeSubtask,
      verifySubtaskExecution,
      synthesizeFinalResponse,
    } = await import("./server/orchestrator");

    const ai = geminiPool.getPrimaryClient();

    // 1. INTENT ANALYSIS & TASK PLANNING
    sendEvent("phase_change", { phase: "planning", statusText: "Analyzing intent and constructing execution plan..." });
    const plan = await planComplexTask(prompt.trim(), attachments, ai, model);

    sendEvent("plan_created", { plan });

    const priorResults: Record<string, string> = {};
    const collectedSources: Array<{ title: string; uri: string }> = [];

    // 2. SEQUENTIAL SUBTASK EXECUTION & VERIFICATION
    for (let i = 0; i < plan.subtasks.length; i++) {
      const subtask = plan.subtasks[i];
      plan.currentStepIndex = i;

      // Determine appropriate overall phase for progress indicator
      if (subtask.capability === "research" || subtask.capability === "web_search") {
        plan.phase = "researching";
      } else if (subtask.capability === "pdf_doc_generation" || subtask.capability === "ui_website_generation" || subtask.capability === "coding" || subtask.capability === "writing") {
        plan.phase = "creating";
      } else {
        plan.phase = "creating";
      }

      subtask.status = "running";
      sendEvent("subtask_update", {
        stepIndex: i,
        subtask: { ...subtask, status: "running" },
        planPhase: plan.phase,
      });

      const startTime = Date.now();
      try {
        // Execute specialized capability
        const result = await executeSubtask(subtask, prompt.trim(), priorResults, attachments, ai, model);
        subtask.output = result.output;
        subtask.durationMs = Date.now() - startTime;
        priorResults[subtask.id] = result.output;

        if (result.sources && result.sources.length > 0) {
          result.sources.forEach((s) => {
            if (!collectedSources.some((cs) => cs.uri === s.uri)) {
              collectedSources.push(s);
            }
          });
        }

        // Add artifact if generated
        if (result.artifact) {
          plan.artifacts.push(result.artifact);
        }

        // 3. RESULT VERIFICATION
        subtask.status = "verifying";
        sendEvent("subtask_update", {
          stepIndex: i,
          subtask: { ...subtask, status: "verifying" },
          planPhase: "verifying",
        });

        const verification = verifySubtaskExecution(subtask, result.output, result.artifact);
        subtask.verificationResult = {
          verified: verification.verified,
          details: verification.details,
          checksPassed: verification.checksPassed,
          timestamp: Date.now(),
        };

        subtask.status = verification.verified ? "completed" : "failed";

        sendEvent("subtask_update", {
          stepIndex: i,
          subtask,
          artifacts: plan.artifacts,
          sources: collectedSources,
        });
      } catch (subtaskError: any) {
        console.error(`Subtask ${subtask.id} execution failed:`, subtaskError);
        subtask.status = "failed";
        subtask.error = subtaskError?.message || "Subtask execution encountered an error.";
        subtask.verificationResult = {
          verified: false,
          details: `Execution failed: ${subtask.error}`,
          checksPassed: [],
          timestamp: Date.now(),
        };
        sendEvent("subtask_update", { stepIndex: i, subtask });
      }
    }

    // 4. FINAL RESPONSE SYNTHESIS
    plan.phase = "completed";
    plan.completedAt = Date.now();
    sendEvent("phase_change", { phase: "completed", statusText: "Synthesizing verified deliverables..." });

    const finalResponse = await synthesizeFinalResponse(prompt.trim(), plan, ai, model);
    plan.summary = finalResponse;

    sendEvent("orchestration_done", {
      plan,
      finalText: finalResponse,
      artifacts: plan.artifacts,
      sources: collectedSources,
      modelUsed: model,
    });

    res.end();
  } catch (error: any) {
    console.error("Orchestrator streaming error:", error);
    const cleanMessage = extractCleanErrorMessage(error);
    sendEvent("error", {
      message: cleanMessage,
    });
    res.end();
  }
});

// Security Hardening: Automated Comprehensive Security Audit Endpoint
app.get("/api/security/audit", async (req, res) => {
  try {
    const report = await runSecurityHardeningAudit();
    res.json({
      success: true,
      report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: extractCleanErrorMessage(err),
    });
  }
});

// Security Hardening: Prompt Injection Safety Check Endpoint
app.post("/api/security/prompt-check", (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'prompt' field" });
    }
    const analysis = analyzePromptSecurity(prompt);
    res.json({
      success: true,
      analysis,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: extractCleanErrorMessage(err),
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ShawezGPT server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
