import { RUFLO_SWARM_AGENTS, routeTaskToSwarmAgent, getAgentById } from './swarmAgents';
import { SwarmMissionPlan, SwarmSubtask, SwarmTopology } from './swarmTypes';

export class RufloSwarmCoordinator {
  public static createMissionPlan(userGoal: string, topology: SwarmTopology = 'hierarchical'): SwarmMissionPlan {
    const planId = 'mission_' + Math.random().toString(36).slice(2, 9);
    const leadAgent = getAgentById('agent-queen-coordinator') || RUFLO_SWARM_AGENTS[0];
    const lower = userGoal.toLowerCase();

    const subtasks: SwarmSubtask[] = [];

    if (lower.includes('resume') || lower.includes('cv') || lower.includes('portfolio')) {
      subtasks.push({
        id: 'task_1',
        title: 'Career Profile & Skill Matrix Extraction',
        description: 'Extract core competencies, quantified impact achievements, and ATS keyword matrix.',
        domain: 'research',
        assignedAgentId: 'agent-scout-explorer',
        assignedAgentName: 'Deep Research Scout',
        status: 'pending',
      });
      subtasks.push({
        id: 'task_2',
        title: 'Draft 2-Column Executive Resume Content',
        description: 'Draft high-impact experience bullet points, certifications, and project summaries.',
        domain: 'design',
        assignedAgentId: 'agent-spec-designer',
        assignedAgentName: 'Visual Document Studio Designer',
        status: 'pending',
        dependsOn: ['task_1'],
      });
      subtasks.push({
        id: 'task_3',
        title: 'Compile 300 DPI Vector PDF Document',
        description: 'Render responsive executive layout and generate high-res printable PDF artifact.',
        domain: 'design',
        assignedAgentId: 'agent-spec-designer',
        assignedAgentName: 'Visual Document Studio Designer',
        status: 'pending',
        dependsOn: ['task_2'],
      });
    } else if (lower.includes('app') || lower.includes('website') || lower.includes('game') || lower.includes('ui')) {
      subtasks.push({
        id: 'task_1',
        title: 'Architecture & UI Component Blueprint',
        description: 'Define component structure, state flow, styling rules, and responsive layout.',
        domain: 'architecture',
        assignedAgentId: 'agent-repo-architect',
        assignedAgentName: 'Chief Systems Architect',
        status: 'pending',
      });
      subtasks.push({
        id: 'task_2',
        title: 'Build Live Interactive WebApp Code',
        description: 'Generate complete, self-contained HTML/Tailwind/JS application for in-app execution.',
        domain: 'design',
        assignedAgentId: 'agent-sandbox-runner',
        assignedAgentName: 'Interactive App Runner',
        status: 'pending',
        dependsOn: ['task_1'],
      });
      subtasks.push({
        id: 'task_3',
        title: 'Security & Quality Verification',
        description: 'Audit code for XSS, DOM injection, and verify error boundaries.',
        domain: 'security',
        assignedAgentId: 'agent-v3-security-architect',
        assignedAgentName: 'Security & Permission Guardian',
        status: 'pending',
        dependsOn: ['task_2'],
      });
    } else if (lower.includes('debug') || lower.includes('fix') || lower.includes('code') || lower.includes('error')) {
      subtasks.push({
        id: 'task_1',
        title: 'Bug & Architecture Root Cause Analysis',
        description: 'Inspect stack traces, locate syntax errors, race conditions, or edge case failures.',
        domain: 'review',
        assignedAgentId: 'agent-code-reviewer',
        assignedAgentName: 'Code Reviewer & Quality Auditor',
        status: 'pending',
      });
      subtasks.push({
        id: 'task_2',
        title: 'Implement Clean Bug-Free Code',
        description: 'Produce robust, type-safe implementation with best engineering practices.',
        domain: 'coding',
        assignedAgentId: 'agent-coder',
        assignedAgentName: 'Lead Polyglot Engineer',
        status: 'pending',
        dependsOn: ['task_1'],
      });
      subtasks.push({
        id: 'task_3',
        title: 'Generate Automated TDD Test Suite',
        description: 'Provide automated test assertions and verification fixtures.',
        domain: 'testing',
        assignedAgentId: 'agent-tester',
        assignedAgentName: 'TDD Test Engineer',
        status: 'pending',
        dependsOn: ['task_2'],
      });
    } else {
      subtasks.push({
        id: 'task_1',
        title: 'Deep Requirements Analysis & Fact Gathering',
        description: 'Deconstruct user prompt, investigate key parameters, and evaluate constraints.',
        domain: 'research',
        assignedAgentId: 'agent-scout-explorer',
        assignedAgentName: 'Deep Research Scout',
        status: 'pending',
      });
      subtasks.push({
        id: 'task_2',
        title: 'Execute Core Deliverable Synthesis',
        description: 'Formulate comprehensive, publication-ready response with rich markdown formatting.',
        domain: 'coding',
        assignedAgentId: 'agent-coder',
        assignedAgentName: 'Lead Polyglot Engineer',
        status: 'pending',
        dependsOn: ['task_1'],
      });
    }

    return {
      id: planId,
      userGoal,
      topology,
      leadAgent,
      subtasks,
      status: 'planning',
      totalTokensEstimated: subtasks.length * 800,
      startedAt: Date.now(),
    };
  }
}
