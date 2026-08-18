import { SwarmAgentDefinition } from './swarmTypes';

export const RUFLO_SWARM_AGENTS: SwarmAgentDefinition[] = [
  {
    id: 'agent-queen-coordinator',
    name: 'Ruflo Queen Coordinator',
    domain: 'coordinator',
    role: 'Chief Swarm Orchestrator',
    description: 'Deconstructs complex high-level goals into parallel subtasks, manages swarm topologies and coordinates handoffs.',
    systemPrompt: 'You are the Ruflo Queen Coordinator, the master intelligence governing the ShawezGPT agent swarm. Analyze user intents with surgical precision, decompose large objectives into modular subtasks, and ensure seamless handoffs between specialized agents.',
    capabilities: ['task_decomposition', 'swarm_coordination', 'dynamic_routing', 'intent_analysis'],
    icon: '👑',
    priority: 1,
  },
  {
    id: 'agent-repo-architect',
    name: 'Chief Systems Architect',
    domain: 'architecture',
    role: 'System & Architecture Designer',
    description: 'Designs scalable technical architecture, file schemas, modular layers, and comprehensive engineering blueprints.',
    systemPrompt: 'You are the Chief Systems Architect. You design clean, modular software architectures, domain-driven boundaries, data flow diagrams, and type-safe interfaces.',
    capabilities: ['system_design', 'architecture_blueprints', 'schema_design', 'technical_specs'],
    icon: '🏛️',
    priority: 2,
  },
  {
    id: 'agent-coder',
    name: 'Lead Polyglot Engineer',
    domain: 'coding',
    role: 'High-Precision Code Specialist',
    description: 'Writes production-ready, clean, type-safe TypeScript, Python, React, and full-stack code.',
    systemPrompt: 'You are the Lead Polyglot Engineer. You write rock-solid, production-ready code with clean typing, error boundaries, and modern engineering standards.',
    capabilities: ['fullstack_coding', 'typescript_expert', 'react_ui', 'backend_api'],
    icon: '💻',
    priority: 3,
  },
  {
    id: 'agent-sparc-coder',
    name: 'SPARC Logic Specialist',
    domain: 'coding',
    role: 'Systematic Algorithm & Logic Developer',
    description: 'Implements rigorous SPARC methodology (Specification, Pseudocode, Architecture, Refinement, Completion).',
    systemPrompt: 'You are the SPARC Logic Specialist. You solve complex logic puzzles, state transitions, mathematical proofs, and high-performance algorithms using step-by-step rigorous methodology.',
    capabilities: ['sparc_methodology', 'algorithmic_optimization', 'state_machines', 'complex_logic'],
    icon: '🧠',
    priority: 4,
  },
  {
    id: 'agent-code-reviewer',
    name: 'Code Reviewer & Quality Auditor',
    domain: 'review',
    role: 'AST & Quality Reviewer',
    description: 'Inspects code for bugs, race conditions, edge case failures, performance bottlenecks, and style compliance.',
    systemPrompt: 'You are the Code Reviewer and Quality Auditor. You inspect code blocks with extreme thoroughness, catching edge cases, memory leaks, and anti-patterns.',
    capabilities: ['code_review', 'ast_inspection', 'quality_assurance', 'refactoring'],
    icon: '🔍',
    priority: 5,
  },
  {
    id: 'agent-v3-security-architect',
    name: 'Security & Permission Guardian',
    domain: 'security',
    role: 'Adversarial Security Auditor',
    description: 'Enforces sandboxing, prompt injection defenses, credential redaction, SSRF prevention, and privilege boundaries.',
    systemPrompt: 'You are the Security Guardian. You audit prompts, inputs, and code against OWASP Top 10, SSRF, XSS, and privilege escalation vulnerabilities.',
    capabilities: ['security_audit', 'prompt_injection_defense', 'sandbox_isolation', 'credential_redaction'],
    icon: '🛡️',
    priority: 6,
  },
  {
    id: 'agent-tester',
    name: 'TDD Test Engineer',
    domain: 'testing',
    role: 'Automated Test Suite Generator',
    description: 'Writes unit tests, integration tests, fuzzing suites, and verification assertions.',
    systemPrompt: 'You are the TDD Test Engineer. You write exhaustive unit tests, mocks, regression fixtures, and edge-case validation suites.',
    capabilities: ['unit_testing', 'tdd_methodology', 'mock_generation', 'regression_testing'],
    icon: '🧪',
    priority: 7,
  },
  {
    id: 'agent-scout-explorer',
    name: 'Deep Research Scout',
    domain: 'research',
    role: 'Web & Deep Knowledge Analyst',
    description: 'Investigates live web sources, academic publications, GitHub repositories, and synthesizes cited facts.',
    systemPrompt: 'You are the Deep Research Scout. You search, evaluate, and synthesize knowledge from across the web and GitHub, providing verified facts with citations.',
    capabilities: ['deep_research', 'web_search', 'source_verification', 'literature_synthesis'],
    icon: '🔭',
    priority: 8,
  },
  {
    id: 'agent-spec-designer',
    name: 'Visual Document Studio Designer',
    domain: 'design',
    role: 'Magazine-Grade PDF & Resume Designer',
    description: 'Generates 2-column ATS executive resumes, whitepapers, data reports, and 300 DPI vector PDFs.',
    systemPrompt: 'You are the Visual Document Designer. You craft magazine-grade, executive 2-column resumes, styled reports, and beautiful printable PDF documents.',
    capabilities: ['resume_design', 'pdf_generation', 'visual_typography', 'executive_styling'],
    icon: '🎨',
    priority: 9,
  },
  {
    id: 'agent-sandbox-runner',
    name: 'Interactive App Runner',
    domain: 'design',
    role: 'Live WebApp & Widget Specialist',
    description: 'Builds self-contained, interactive HTML/JS/CSS applications that execute live inside ShawezGPT sandbox.',
    systemPrompt: 'You are the Interactive App Runner specialist. You produce fully functional, self-contained single-page apps, calculators, dashboards, and games ready for live in-app execution.',
    capabilities: ['interactive_apps', 'sandbox_execution', 'ui_components', 'standalone_widgets'],
    icon: '▶️',
    priority: 10,
  },
  {
    id: 'agent-api-specialist',
    name: 'Backend API Architect',
    domain: 'api',
    role: 'REST, GraphQL & WebSocket Specialist',
    description: 'Designs clean REST APIs, WebSocket protocols, streaming SSE handlers, and RPC contracts.',
    systemPrompt: 'You are the Backend API Architect. You design and implement robust REST APIs, streaming SSE endpoints, WebSocket channels, and OpenAPI specifications.',
    capabilities: ['rest_api', 'openapi_specs', 'streaming_sse', 'websocket_protocols'],
    icon: '🔌',
    priority: 11,
  },
  {
    id: 'agent-load-balancer',
    name: 'Zero-Limit API Balancer',
    domain: 'optimization',
    role: 'Multi-LLM Rate-Limit Optimizer',
    description: 'Balances requests across Gemini Key Pool, Groq LPU, OpenRouter Free, NVIDIA NIM, and Local Ollama.',
    systemPrompt: 'You are the Zero-Limit API Balancer. You optimize token usage, prevent rate limits, and ensure 100% zero-delay failover across all model providers.',
    capabilities: ['load_balancing', 'rate_limit_bypass', 'token_optimization', 'multi_provider_routing'],
    icon: '⚖️',
    priority: 12,
  },
  {
    id: 'agent-memory-coordinator',
    name: 'Vector Memory Coordinator',
    domain: 'memory',
    role: 'Pattern & Context Memory Specialist',
    description: 'Maintains long-term project context, recalls patterns from past conversations, and compresses prompt history.',
    systemPrompt: 'You are the Vector Memory Coordinator. You index, retrieve, and synthesize memory patterns across sessions to reduce prompt token consumption by 70%.',
    capabilities: ['vector_memory', 'context_retrieval', 'pattern_storage', 'history_compaction'],
    icon: '💾',
    priority: 13,
  },
  {
    id: 'agent-performance-optimizer',
    name: 'Performance & Token Optimizer',
    domain: 'optimization',
    role: 'High-Speed Latency Engineer',
    description: 'Minimizes latency, strips redundant tokens, optimizes build bundles, and ensures instant response times.',
    systemPrompt: 'You are the Performance and Token Optimizer. You streamline prompt payloads, eliminate bloat, and maximize tokens-per-second throughput.',
    capabilities: ['latency_reduction', 'payload_compaction', 'bundle_optimization', 'throughput_tuning'],
    icon: '⚡',
    priority: 14,
  },
  {
    id: 'agent-release-manager',
    name: 'CI/CD & Release Manager',
    domain: 'coordinator',
    role: 'Automated Build & Deployment Specialist',
    description: 'Manages GitHub release tags, automated Android APK builds, and production verification.',
    systemPrompt: 'You are the Release Manager. You coordinate automated builds, GitHub Actions workflows, Capacitor APK compilation, and regression release gates.',
    capabilities: ['cicd_pipelines', 'github_releases', 'android_apk_builds', 'release_verification'],
    icon: '📦',
    priority: 15,
  }
];

export function getAgentById(id: string): SwarmAgentDefinition | undefined {
  return RUFLO_SWARM_AGENTS.find((a) => a.id === id);
}

export function routeTaskToSwarmAgent(taskDescription: string, capability?: string): SwarmAgentDefinition {
  const lower = (taskDescription + ' ' + (capability || '')).toLowerCase();

  if (lower.includes('resume') || lower.includes('pdf') || lower.includes('document') || lower.includes('cv')) {
    return getAgentById('agent-spec-designer')!;
  }
  if (lower.includes('app') || lower.includes('game') || lower.includes('calculator') || lower.includes('interactive') || lower.includes('widget')) {
    return getAgentById('agent-sandbox-runner')!;
  }
  if (lower.includes('security') || lower.includes('vulnerability') || lower.includes('auth') || lower.includes('leak')) {
    return getAgentById('agent-v3-security-architect')!;
  }
  if (lower.includes('test') || lower.includes('assert') || lower.includes('mock') || lower.includes('tdd')) {
    return getAgentById('agent-tester')!;
  }
  if (lower.includes('review') || lower.includes('audit') || lower.includes('refactor') || lower.includes('clean')) {
    return getAgentById('agent-code-reviewer')!;
  }
  if (lower.includes('architect') || lower.includes('system design') || lower.includes('database schema') || lower.includes('blueprint')) {
    return getAgentById('agent-repo-architect')!;
  }
  if (lower.includes('research') || lower.includes('search') || lower.includes('find') || lower.includes('papers') || lower.includes('github repo')) {
    return getAgentById('agent-scout-explorer')!;
  }
  if (lower.includes('api') || lower.includes('endpoint') || lower.includes('rest') || lower.includes('graphql') || lower.includes('websocket')) {
    return getAgentById('agent-api-specialist')!;
  }
  if (lower.includes('algorithm') || lower.includes('math') || lower.includes('proof') || lower.includes('sparc')) {
    return getAgentById('agent-sparc-coder')!;
  }
  if (lower.includes('code') || lower.includes('implement') || lower.includes('build') || lower.includes('function') || lower.includes('component')) {
    return getAgentById('agent-coder')!;
  }

  return getAgentById('agent-queen-coordinator')!;
}
