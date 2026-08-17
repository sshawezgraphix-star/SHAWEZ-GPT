import { AIModel, OrchestratorCapabilityInfo, Persona } from "../types";

export const DEFAULT_MODELS: AIModel[] = [
  {
    id: "gemini-2.5-flash",
    name: "Shawez Turbo 2.5",
    description: "Our flagship multimodal model for blazing speed, complex reasoning, and expert multi-task orchestration.",
    contextWindow: "1M tokens",
    badge: "Orchestrator Pro",
    category: "Balanced",
    supportsSearch: true,
    supportsVision: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Shawez Deep Pro",
    description: "Deep analytical reasoning model designed for high-level algorithms, STEM, multi-stage planning, and research.",
    contextWindow: "2M tokens",
    badge: "Deep Reasoning",
    category: "Pro Intelligence",
    supportsSearch: true,
    supportsVision: true,
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Shawez Ultra Lite",
    description: "Ultra-low latency model engineered for instantaneous responses and lightweight tasks.",
    contextWindow: "1M tokens",
    badge: "Ultra Fast",
    category: "High Speed",
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
    id: "pdf_doc_generation",
    name: "PDF & Document Generation",
    description: "Compiling professional, verified, publication-ready PDF reports with styling.",
    iconName: "FileDown",
    badgeColor: "indigo",
  },
  {
    id: "data_analysis",
    name: "Data Analysis",
    description: "Statistical breakdown, quantitative evaluations, trends, and metrics tables.",
    iconName: "BarChart3",
    badgeColor: "violet",
  },
  {
    id: "writing",
    name: "Writing",
    description: "Executive summaries, technical documentation, essays, and reports.",
    iconName: "PenTool",
    badgeColor: "sky",
  },
  {
    id: "ui_website_generation",
    name: "UI / Website Generation",
    description: "Live interactive prototypes, React/Tailwind components, and sandbox previews.",
    iconName: "Layout",
    badgeColor: "fuchsia",
  },
  {
    id: "image_understanding",
    name: "Image Understanding",
    description: "Multimodal visual reasoning, diagram inspection, and UI mock extraction.",
    iconName: "ImageIcon",
    badgeColor: "orange",
  },
  {
    id: "general_ai",
    name: "General AI Assistance",
    description: "Strategic logic, planning, orchestration coordination, and synthesis.",
    iconName: "Sparkles",
    badgeColor: "emerald",
  },
];

export const PERSONAS: Persona[] = [
  {
    id: "general",
    name: "Shawez Assistant",
    description: "Versatile, insightful, and articulate general intelligence.",
    iconName: "Sparkles",
    category: "General",
    systemPrompt:
      "You are ShawezGPT, an advanced, thoughtful, and highly capable AI assistant. Provide direct, beautifully structured, and accurate responses. Use markdown formatting with clear headings, bullet points, and code blocks whenever appropriate.",
  },
  {
    id: "orchestrator",
    name: "Master Task Orchestrator",
    description: "Deconstructs complex goals into ordered subtasks, coordinates tools, and verifies deliverables.",
    iconName: "Cpu",
    category: "Productivity",
    systemPrompt:
      "You are ShawezGPT Master Task Orchestrator. When receiving a complex request, perform structured intent analysis, plan subtasks across specialized capabilities (Coding, Research, PDF Generation, Data Analysis, UI Generation), verify all outputs rigorously, and deliver an integrated executive response with verified artifacts.",
  },
  {
    id: "coder",
    name: "Code Architect & Senior Engineer",
    description: "Master programmer specializing in clean code, architecture, and debugging.",
    iconName: "Code2",
    category: "Coding",
    systemPrompt:
      "You are ShawezGPT in Senior Software Architect mode. Write modern, production-grade, bug-free TypeScript/JavaScript/Python/Rust code with best security practices, type safety, modular structures, and concise explanatory comments. Always explain edge cases and efficiency trade-offs.",
  },
  {
    id: "writer",
    name: "Executive Writer & Copywriter",
    description: "Polished writing, high-impact executive summaries, and creative content.",
    iconName: "PenTool",
    category: "Writing",
    systemPrompt:
      "You are ShawezGPT in Executive Copywriting & Editorial mode. Craft compelling, eloquent, and succinct prose with flawless tone and structure. Adapt effortlessly to emails, blog posts, whitepapers, speeches, and creative narratives.",
  },
  {
    id: "analyst",
    name: "Data & Systems Analyst",
    description: "Deep critical thinking, root-cause analysis, and statistical breakdown.",
    iconName: "BarChart3",
    category: "Analysis",
    systemPrompt:
      "You are ShawezGPT in Data & Systems Analyst mode. Deconstruct problems with methodical logic, provide structured quantitative evaluations, identify subtle anomalies, and output actionable strategic recommendations.",
  },
];

export interface StarterPrompt {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  iconName: string;
  category: string;
  isMultiTask?: boolean;
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: "1",
    title: "Multi-Task Research & PDF Report",
    subtitle: "Research, analyze, write, and compile verified PDF",
    prompt: "Research the current state of autonomous AI agents in 2025/2026, analyze their architecture and key challenges, write a structured executive report, turn it into a professional PDF, and give me the final file.",
    iconName: "FileDown",
    category: "Multi-Task Orchestrator",
    isMultiTask: true,
  },
  {
    id: "2",
    title: "Analyze, Debug & Document Code",
    subtitle: "Deep bug inspection, unit tests & architecture docs",
    prompt: "Analyze this async caching architecture, identify race condition bugs, provide the fixed TypeScript implementation, and write comprehensive unit tests and verification steps.",
    iconName: "Bug",
    category: "Coding & Debugging",
    isMultiTask: true,
  },
  {
    id: "3",
    title: "Market Analysis & UI Prototype",
    subtitle: "Analyze market data and build an interactive UI widget",
    prompt: "Research top developer productivity trends, analyze the numerical growth metrics in a structured table, and generate an interactive modern UI dashboard preview component.",
    iconName: "Layout",
    category: "UI & Data",
    isMultiTask: true,
  },
  {
    id: "4",
    title: "Quick Smart Reasoning",
    subtitle: "Direct answers, coding solutions & general queries",
    prompt: "Explain how modern vector databases indexing algorithms (HNSW, IVFPQ) work under the hood with an intuitive analogy and Python code sample.",
    iconName: "Sparkles",
    category: "General Intelligence",
  },
];
