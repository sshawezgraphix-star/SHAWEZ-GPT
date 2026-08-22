import { AIModel, OrchestratorCapabilityInfo, Persona } from "../types";

export const DEFAULT_MODELS: AIModel[] = [
  {
    id: "omni-route",
    name: "OmniRoute AI (Auto-Intelligence)",
    description: "Universal meta-intelligence that automatically detects your task intent and routes to the best flagship model or multi-agent swarm.",
    contextWindow: "1M tokens",
    badge: "Auto Omni",
    category: "Smart Auto",
    supportsSearch: true,
    supportsVision: true,
  },
  {
    id: "gpt-4o",
    name: "ChatGPT GPT-4o (OpenAI)",
    description: "OpenAI flagship intelligence for multifaceted reasoning, STEM, coding, creative writing, and natural conversation.",
    contextWindow: "128K tokens",
    badge: "ChatGPT-4o",
    category: "Pro Flagship",
    supportsSearch: true,
    supportsVision: true,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet (Anthropic)",
    description: "World-class coding powerhouse for system architecture, complex logic, document synthesis, and bug fixing.",
    contextWindow: "200K tokens",
    badge: "Claude 3.5",
    category: "Pro Flagship",
    supportsSearch: true,
    supportsVision: true,
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1 (Deep Reasoning)",
    description: "State-of-the-art open reasoning model with transparent chain-of-thought, mathematical proofs, and advanced algorithms.",
    contextWindow: "128K tokens",
    badge: "Deep Reasoning",
    category: "Pro Flagship",
    supportsSearch: true,
    supportsVision: true,
  },
  {
    id: "ruflo-swarm",
    name: "Ruflo Swarm Coordinator (6 AI Swarm)",
    description: "Autonomous multi-agent swarm combining RufloIntelligence, RufloBrowser, RufloRAGMemory, RufloAutoAgent, and RufloSecurity.",
    contextWindow: "1M tokens",
    badge: "Ruflo Swarm",
    category: "Autonomous Swarm",
    supportsSearch: true,
    supportsVision: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "ShawezGPT 4o Turbo (Flagship)",
    description: "Ultra-fast flagship model with zero quota limits, 4-key auto-failover, and native multimodal vision.",
    contextWindow: "1M tokens",
    badge: "Ultra Fast",
    category: "High Speed",
    supportsSearch: true,
    supportsVision: true,
  },
  {
    id: "llama-3.3-70b",
    name: "Meta Llama 3.3 70B (Meta AI)",
    description: "Meta's flagship 70B open-weight intelligence model with 405B-level performance for reasoning, coding, and general tasks.",
    contextWindow: "128K tokens",
    badge: "Meta AI",
    category: "Open Source",
    supportsSearch: true,
    supportsVision: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Shawez Deep Intelligence Pro",
    description: "Deep analytical reasoning model designed for complex code architecture, multi-stage project planning, and massive document synthesis.",
    contextWindow: "2M tokens",
    badge: "2M Context",
    category: "Deep Pro",
    supportsSearch: true,
    supportsVision: true,
  },
];

export const ORCHESTRATOR_CAPABILITIES: OrchestratorCapabilityInfo[] = [
  {
    id: "coding",
    name: "Coding",
    description: "Full-stack code generation, algorithms, scripts, APIs, and refactoring.",
    iconName: "Code2",
    badgeColor: "emerald",
  },
  {
    id: "code_analysis_debugging",
    name: "Code Analysis & Debugging",
    description: "Syntax inspection, bug discovery, error tracing, profiling, and fixing.",
    iconName: "Bug",
    badgeColor: "rose",
  },
  {
    id: "research",
    name: "Research",
    description: "Deep multi-source knowledge investigation and factual synthesis.",
    iconName: "Search",
    badgeColor: "blue",
  },
  {
    id: "web_search",
    name: "Web Search",
    description: "Real-time Google search grounding for up-to-date facts and citations.",
    iconName: "Globe",
    badgeColor: "teal",
  },
  {
    id: "file_analysis",
    name: "File Analysis",
    description: "Parsing, extracting, and analyzing uploaded files, logs, and datasets.",
    iconName: "FileSpreadsheet",
    badgeColor: "amber",
  },
  {
    id: "data_synthesis",
    name: "Data Synthesis",
    description: "Transforming raw data into clear reports, summaries, and visualizations.",
    iconName: "Sparkles",
    badgeColor: "purple",
  },
];

export const PERSONAS: Persona[] = [
  {
    id: "general",
    name: "Direct & Helpful Assistant",
    description: "Direct, concise, accurate, and structured answers for all general topics.",
    systemInstruction: "You are ShawezGPT, an advanced AI. Answer the user's questions directly, accurately, and politely in the language requested. Use clean formatting with headings and code blocks.",
    iconName: "Sparkles",
  },
  {
    id: "developer",
    name: "Senior Software Architect",
    description: "Writes production-ready, clean, well-tested code with best practices and architecture design.",
    systemInstruction: "You are a Senior Full-Stack Software Architect and Principal Engineer. When answering code queries, provide clean, idiomatic, fully functional code with clear explanations, edge-case coverage, and correct syntax.",
    iconName: "Code2",
  },
  {
    id: "researcher",
    name: "Academic & Science Analyst",
    description: "Fact-based, cited, structured, and in-depth scientific analysis.",
    systemInstruction: "You are a Senior Research Scientist. Deliver rigorous, evidence-grounded, and structured analysis with clear methodology, nuanced perspectives, and factual precision.",
    iconName: "BrainCircuit",
  },
  {
    id: "creative",
    name: "Creative Strategist & Writer",
    description: "Engaging storytelling, marketing copy, content generation, and brainstorms.",
    systemInstruction: "You are an elite Creative Director and Copywriter. Create vivid, imaginative, and engaging narratives, pitches, and creative ideas.",
    iconName: "Lightbulb",
  },
];

export interface StarterPrompt {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  iconName: string;
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: "code-refactor",
    title: "Code Architecture & Refactor",
    subtitle: "Clean code, optimizations & bug fixes",
    prompt: "Write a high-performance, modular React component with TypeScript that implements a real-time data table with sorting, filtering, and pagination.",
    iconName: "Code2",
  },
  {
    id: "deep-analysis",
    title: "Deep Reasoning & Math",
    subtitle: "Complex algorithms and logic",
    prompt: "Explain how modern transformer self-attention mechanisms calculate token relationships mathematically with key, query, and value matrix operations.",
    iconName: "BrainCircuit",
  },
  {
    id: "ruflo-swarm",
    title: "Ruflo Multi-Agent Swarm",
    subtitle: "Autonomous 6-AI research & audit",
    prompt: "Activate Ruflo 6-AI Swarm to perform a comprehensive full-stack security and architecture review of a web application.",
    iconName: "Smartphone",
  },
  {
    id: "omni-routing",
    title: "OmniRoute Auto Intelligence",
    subtitle: "Automatic intent detection & routing",
    prompt: "Help me brainstorm and architect a full SaaS application from backend database schema to frontend UI components and deployment strategy.",
    iconName: "Lightbulb",
  },
];
