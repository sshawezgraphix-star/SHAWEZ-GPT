import { AppSettings, Conversation, GeneratedArtifact, Message, MissionState, Project, ProjectFile, UserProfile } from "../types";

const STORAGE_KEYS = {
  CONVERSATIONS: "shawezgpt_conversations_v1",
  ACTIVE_ID: "shawezgpt_active_id_v1",
  SETTINGS: "shawezgpt_settings_v1",
  USER: "shawezgpt_user_profile_v1",
  PROJECTS: "shawezgpt_projects_v2",
  ACTIVE_PROJECT_ID: "shawezgpt_active_project_id_v2",
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  defaultModelId: "gemini-3.7-flash",
  defaultPersonaId: "general",
  temperature: 0.7,
  soundEffects: true,
  autoScroll: true,
  fontSize: "normal",
  codeWrap: true,
  speechRate: 1.0,
  orchestratorMode: "auto",
};

export const DEFAULT_USER: UserProfile = {
  id: "usr_guest",
  name: "Guest Explorer",
  email: "guest@shawezgpt.ai",
  avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=ShawezGuest",
  plan: "Free Tier",
  createdAt: new Date().toISOString(),
  isGuest: true,
};

// Seed initial projects
export const DEFAULT_PROJECTS: Project[] = [
  {
    id: "prj_default",
    name: "Main Workspace",
    description: "Primary AI development, research, and general workspace",
    icon: "Sparkles",
    color: "emerald",
    createdAt: Date.now() - 7 * 86400000,
    updatedAt: Date.now(),
    conversations: [],
    files: [
      {
        id: "file_sys_spec",
        projectId: "prj_default",
        name: "system_architecture_manifest.md",
        type: "document",
        mimeType: "text/markdown",
        size: 2450,
        uploadedAt: Date.now() - 3 * 86400000,
        tags: ["architecture", "spec", "v2"],
        description: "Core ShawezGPT autonomous agent cluster specification.",
        textContent: `# ShawezGPT Workspace Architecture Specification

## Overview
ShawezGPT provides an autonomous agent cluster powered by Google Gemini, capable of DAG planning, topological parallel execution, memory privacy isolation, and multi-tier verification.

## Core Capabilities
- **DAG Planner Engine**: Automatic dependency resolution and stage wave grouping.
- **Dynamic Task Routing**: Contextual agent selection with confidence scoring.
- **Zero-Credential Privacy Sanitizer**: Automatic redaction of sensitive API keys and tokens.
- **Multi-Type Artifact Production**: PDF reports, code files, and sandbox-rendered UI prototypes.`,
      },
      {
        id: "file_benchmark_json",
        projectId: "prj_default",
        name: "agent_benchmarks_2026.json",
        type: "data",
        mimeType: "application/json",
        size: 1820,
        uploadedAt: Date.now() - 2 * 86400000,
        tags: ["data", "benchmark", "telemetry"],
        description: "Benchmark telemetry across 8 registered agent capabilities.",
        textContent: JSON.stringify(
          {
            version: "2.5.0",
            totalAgents: 8,
            activeAgents: 8,
            avgLatencyMs: 24.5,
            verificationPassRate: 1.0,
            securityMitigations: 15,
            suitesPassed: "32/32",
          },
          null,
          2
        ),
      },
    ],
    missions: [],
    artifacts: [
      {
        id: "art_seed_report",
        type: "report",
        title: "Workspace Production Readiness Assessment",
        filename: "readiness_assessment.md",
        textContent: `# Workspace Production Readiness Assessment\n\n- **Status**: 100% Verified\n- **Security Boundary**: Hardened\n- **Project Isolation**: Enabled\n- **Memory Engine**: Isolated per Project`,
        metadata: {
          category: "assessment",
          description: "System readiness report for ShawezGPT multi-project workspace.",
        },
      },
    ],
    memories: [],
  },
  {
    id: "prj_quantum_ai",
    name: "Quantum & Neuromorphic Edge",
    description: "Hardware benchmarking, edge tensor architecture, and hybrid co-processors",
    icon: "Cpu",
    color: "indigo",
    createdAt: Date.now() - 4 * 86400000,
    updatedAt: Date.now() - 86400000,
    conversations: [
      {
        id: "conv_quantum_research",
        title: "Quantum Edge Architecture Benchmarks",
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 3600000,
        modelId: "gemini-3.7-flash",
        messages: [
          {
            id: "msg_q1",
            role: "user",
            content: "What are the latest developments in memristive crossbars for edge neuromorphic inference?",
            timestamp: Date.now() - 3600000,
          },
          {
            id: "msg_q2",
            role: "assistant",
            content: "Recent breakthroughs in **memristive crossbar arrays** highlight sub-1.3ms spike latency with an ultra-low energy footprint of ~1.4W. When paired with Zero-Noise Extrapolation (ZNE), error resilience across edge quantum co-processors is improved by over 80%.",
            timestamp: Date.now() - 3590000,
            modelUsed: "gemini-3.7-flash",
          },
        ],
      },
    ],
    files: [
      {
        id: "file_neuromorphic_benchmarks",
        projectId: "prj_quantum_ai",
        name: "neuromorphic_latency_matrix.csv",
        type: "data",
        mimeType: "text/csv",
        size: 980,
        uploadedAt: Date.now() - 86400000,
        tags: ["quantum", "latency", "benchmarks"],
        description: "Comparative latency matrix: GPU vs Neuromorphic vs Hybrid.",
        textContent: `Architecture,Latency_ms,Power_W,Error_Mitigation\nTraditional GPU,14.2,320,Deterministic\nNeuromorphic Edge,2.1,8.5,Probabilistic Filter\nHybrid Quantum-Neuromorphic,0.94,1.4,Zero-Noise Extrapolation`,
      },
    ],
    missions: [],
    artifacts: [
      {
        id: "art_quantum_pdf",
        type: "pdf",
        title: "Executive Report: Quantum AI & Neuromorphic Computing Edge Architectures",
        filename: "quantum_neuromorphic_edge_report.pdf",
        textContent: `# Executive Report: Quantum AI & Neuromorphic Computing Edge Architectures\n\n## 1. Executive Summary\nQuantum computing and neuromorphic architectures represent a pivotal paradigm convergence for edge computing...\n\n## 2. Key Benchmarks\n- Spike Latency: 1.28 ms\n- Energy Envelope: 1.4W\n- Quantum Coherence Volume: 2,048 QV`,
        metadata: {
          fileSize: 42800,
          pageCount: 6,
          category: "publication",
          description: "Verified executive PDF report analyzing quantum & neuromorphic hardware milestones.",
        },
      },
      {
        id: "art_quantum_dashboard",
        type: "ui_preview",
        title: "Interactive Analytics Dashboard: Quantum Neuromorphic Edge",
        filename: "dashboard.html",
        previewHtml: `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-950 text-slate-100 p-6 font-sans"><div class="max-w-4xl mx-auto space-y-4"><h1 class="text-xl font-bold text-indigo-400">Quantum Edge Live Telemetry</h1><div class="grid grid-cols-3 gap-3"><div class="p-3 bg-slate-900 border border-slate-800 rounded-xl"><div class="text-xs text-slate-400">Quantum Volume</div><div class="text-2xl font-bold text-white">2,048 QV</div></div><div class="p-3 bg-slate-900 border border-slate-800 rounded-xl"><div class="text-xs text-slate-400">Latency</div><div class="text-2xl font-bold text-emerald-400">1.28 ms</div></div><div class="p-3 bg-slate-900 border border-slate-800 rounded-xl"><div class="text-xs text-slate-400">Energy</div><div class="text-2xl font-bold text-indigo-400">1.4 W</div></div></div></div></body></html>`,
        metadata: {
          category: "dashboard",
          framework: "HTML5/TailwindCSS",
          description: "Interactive single-file telemetry dashboard component.",
        },
      },
    ],
    memories: [],
  },
  {
    id: "prj_fullstack_saas",
    name: "Autonomous Web & SaaS Suite",
    description: "Full-stack application synthesis, UI prototyping, and API automation",
    icon: "Layers",
    color: "amber",
    createdAt: Date.now() - 2 * 86400000,
    updatedAt: Date.now() - 43200000,
    conversations: [],
    files: [
      {
        id: "file_saas_schema",
        projectId: "prj_fullstack_saas",
        name: "database_schema.sql",
        type: "code",
        mimeType: "application/sql",
        size: 1420,
        uploadedAt: Date.now() - 43200000,
        tags: ["sql", "schema", "saas"],
        description: "PostgreSQL schema for multi-tenant workspace isolation.",
        textContent: `CREATE TABLE workspaces (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\nCREATE TABLE project_files (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,\n  filename VARCHAR(255) NOT NULL,\n  size_bytes INT NOT NULL\n);`,
      },
    ],
    missions: [],
    artifacts: [],
    memories: [],
  },
];

// Project Storage Operations
export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) {
      // Check if we need to migrate legacy conversations to DEFAULT_PROJECTS
      const legacyConvs = loadConversations();
      const initial = [...DEFAULT_PROJECTS];
      if (legacyConvs && legacyConvs.length > 0) {
        initial[0].conversations = legacyConvs;
      }
      saveProjects(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROJECTS;
  } catch (e) {
    console.error("Failed to parse projects from storage:", e);
    return DEFAULT_PROJECTS;
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (e) {
    console.error("Failed to save projects to storage:", e);
  }
}

export function loadActiveProjectId(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
    if (raw) return raw;
    return "prj_default";
  } catch {
    return "prj_default";
  }
}

export function saveActiveProjectId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, id);
  } catch (e) {
    console.error("Failed to save active project ID:", e);
  }
}

export function getProjectById(projectId: string): Project | null {
  const projects = loadProjects();
  return projects.find((p) => p.id === projectId) || null;
}

export function createProject(data: {
  name: string;
  description: string;
  icon?: string;
  color?: string;
}): Project {
  const projects = loadProjects();
  const newProject: Project = {
    id: "prj_" + Math.random().toString(36).substring(2, 9),
    name: data.name.trim(),
    description: data.description.trim(),
    icon: data.icon || "Folder",
    color: data.color || "emerald",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    conversations: [],
    files: [],
    missions: [],
    artifacts: [],
    memories: [],
  };
  const updated = [newProject, ...projects];
  saveProjects(updated);
  return newProject;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx < 0) return null;

  projects[idx] = {
    ...projects[idx],
    ...updates,
    updatedAt: Date.now(),
  };
  saveProjects(projects);
  return projects[idx];
}

export function deleteProject(id: string): boolean {
  const projects = loadProjects();
  if (projects.length <= 1) {
    // Keep at least one project
    return false;
  }
  const filtered = projects.filter((p) => p.id !== id);
  saveProjects(filtered);
  return true;
}

// Project-level Artifact & File operations
export function addFileToProject(projectId: string, file: ProjectFile): void {
  const projects = loadProjects();
  const p = projects.find((proj) => proj.id === projectId);
  if (p) {
    p.files = [file, ...(p.files || []).filter((f) => f.id !== file.id)];
    p.updatedAt = Date.now();
    saveProjects(projects);
  }
}

export function addProjectFile(projectId: string, fileData: Omit<ProjectFile, "id" | "uploadedAt">): ProjectFile {
  const newFile: ProjectFile = {
    ...fileData,
    id: "file_" + Math.random().toString(36).substring(2, 9),
    projectId,
    uploadedAt: Date.now(),
  };
  addFileToProject(projectId, newFile);
  return newFile;
}

export function deleteFileFromProject(projectId: string, fileId: string): void {
  const projects = loadProjects();
  const p = projects.find((proj) => proj.id === projectId);
  if (p) {
    p.files = (p.files || []).filter((f) => f.id !== fileId);
    p.updatedAt = Date.now();
    saveProjects(projects);
  }
}

export const deleteProjectFile = deleteFileFromProject;

export function addArtifactToProject(projectId: string, artifact: GeneratedArtifact): void {
  const projects = loadProjects();
  const p = projects.find((proj) => proj.id === projectId);
  if (p) {
    p.artifacts = [artifact, ...(p.artifacts || []).filter((a) => a.id !== artifact.id)];
    p.updatedAt = Date.now();
    saveProjects(projects);
  }
}

export const addProjectArtifact = addArtifactToProject;

export function addMissionToProject(projectId: string, mission: MissionState): void {
  const projects = loadProjects();
  const p = projects.find((proj) => proj.id === projectId);
  if (p) {
    p.missions = [mission, ...(p.missions || []).filter((m) => m.id !== mission.id)];
    p.updatedAt = Date.now();
    saveProjects(projects);
  }
}

// Legacy Conversations CRUD (synchronized with active project)
export function loadConversations(): Conversation[] {
  try {
    const activePrjId = loadActiveProjectId();
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (raw) {
      const parsed: Project[] = JSON.parse(raw);
      const activePrj = parsed.find((p) => p.id === activePrjId);
      if (activePrj) return activePrj.conversations || [];
    }

    const legacyRaw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!legacyRaw) return [];
    const parsed = JSON.parse(legacyRaw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse conversations from storage:", e);
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    const activePrjId = loadActiveProjectId();
    const projects = loadProjects();
    const p = projects.find((proj) => proj.id === activePrjId);
    if (p) {
      p.conversations = conversations;
      p.updatedAt = Date.now();
      saveProjects(projects);
    }
    // Also save legacy key for backward compatibility
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error("Failed to save conversations to storage:", e);
  }
}

export function loadActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
  } catch {
    return null;
  }
}

export function saveActiveConversationId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    }
  } catch (e) {
    console.error("Failed to save active id:", e);
  }
}

// Settings CRUD
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

// User Profile CRUD
export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return DEFAULT_USER;
    return { ...DEFAULT_USER, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER;
  }
}

export function saveUserProfile(user: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (e) {
    console.error("Failed to save user profile:", e);
  }
}

// Storage space calculation
export function getStorageUsage(): { usedKb: number; percent: number } {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || "";
        total += key.length + val.length;
      }
    }
    const usedKb = Math.round((total * 2) / 1024); // 2 bytes per char approx
    // 5MB is typical localStorage limit (~5120KB)
    const percent = Math.min(100, Math.round((usedKb / 5120) * 100));
    return { usedKb, percent };
  } catch {
    return { usedKb: 0, percent: 0 };
  }
}

// Export single conversation as Markdown
export function exportConversationToMarkdown(conv: Conversation): string {
  let md = `# ${conv.title}\n\n`;
  md += `*Generated with ShawezGPT on ${new Date(conv.createdAt).toLocaleString()}*\n`;
  md += `*Model: ${conv.modelId}*\n\n---\n\n`;

  for (const msg of conv.messages) {
    const roleTitle = msg.role === "user" ? "### 👤 User" : "### ⚡ ShawezGPT";
    md += `${roleTitle} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n`;
    if (msg.attachments && msg.attachments.length > 0) {
      md += `*Attachments:* ${msg.attachments.map((a) => a.name).join(", ")}\n\n`;
    }
    md += `${msg.content}\n\n`;
    if (msg.groundingSources && msg.groundingSources.length > 0) {
      md += `*Sources & Citations:*\n`;
      msg.groundingSources.forEach((s) => {
        md += `- [${s.title}](${s.uri})\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  }
  return md;
}

// Export single conversation as plain text
export function exportConversationToPlainText(conv: Conversation): string {
  let txt = `ShawezGPT Conversation: ${conv.title}\n`;
  txt += `Date: ${new Date(conv.createdAt).toLocaleString()}\n`;
  txt += `=====================================================\n\n`;

  for (const msg of conv.messages) {
    const role = msg.role === "user" ? "USER" : "SHAWEZGPT";
    txt += `[${role} - ${new Date(msg.timestamp).toLocaleTimeString()}]:\n`;
    txt += `${msg.content}\n\n`;
  }
  return txt;
}

