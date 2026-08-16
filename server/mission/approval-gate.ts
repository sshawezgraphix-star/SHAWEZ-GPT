import { ApprovalDangerLevel, ApprovalGateRequest, MissionTask } from "../../src/types";

export interface ApprovalDetectionResult {
  requiresApproval: boolean;
  isIrreversible: boolean;
  dangerLevel: ApprovalDangerLevel;
  actionType: string;
  impactDescription: string;
  reason: string;
}

const IRREVERSIBLE_PATTERNS: Array<{
  pattern: RegExp;
  actionType: string;
  dangerLevel: ApprovalDangerLevel;
  isIrreversible: boolean;
  impactDescription: string;
  reason: string;
}> = [
  {
    pattern: /(?:permanent(?:ly)?\s+delete|destroy|purge|drop\s+database|truncate\s+table|wipe\s+(?:data|disk|storage))/i,
    actionType: "data:permanent_destroy",
    dangerLevel: "critical",
    isIrreversible: true,
    impactDescription: "Permanently deletes stored records or database partitions without backup recovery.",
    reason: "Irreversible data deletion detected in task instructions.",
  },
  {
    pattern: /(?:deploy\s+to\s+production|release\s+to\s+prod|publish\s+live|switch\s+production\s+traffic)/i,
    actionType: "deployment:production_release",
    dangerLevel: "high",
    isIrreversible: true,
    impactDescription: "Will push code live to production environment and expose changes to all users.",
    reason: "Production deployment action requires explicit operator sign-off.",
  },
  {
    pattern: /(?:overwrite\s+(?:production|master|main)|force\s+push|hard\s+reset)/i,
    actionType: "vcs:destructive_overwrite",
    dangerLevel: "high",
    isIrreversible: true,
    impactDescription: "Overwrites version history or production assets irreversibly.",
    reason: "Destructive overwrite operation detected.",
  },
  {
    pattern: /(?:billable|charge|process\s+payment|high[- ]cost\s+api|paid\s+service\s+provisioning)/i,
    actionType: "billing:high_cost_action",
    dangerLevel: "medium",
    isIrreversible: true,
    impactDescription: "May incur external API charges or provision paid cloud infrastructure.",
    reason: "Financial/billable action detected.",
  },
  {
    pattern: /(?:grant\s+admin|modify\s+iam|change\s+root\s+permissions|export\s+(?:keys|secrets|certificates))/i,
    actionType: "security:privilege_modification",
    dangerLevel: "critical",
    isIrreversible: false,
    impactDescription: "Modifies security permissions or exports credentials across trust boundaries.",
    reason: "Elevated security permission modification.",
  },
];

/**
 * Evaluates whether a subtask requires explicit user approval before execution.
 * Never executes irreversible actions without user approval.
 */
export function detectApprovalRequirement(task: {
  title: string;
  description: string;
  capability: string;
  selectedTools?: string[];
}): ApprovalDetectionResult {
  const combinedText = `${task.title} ${task.description} ${(task.selectedTools || []).join(" ")}`;

  for (const rule of IRREVERSIBLE_PATTERNS) {
    if (rule.pattern.test(combinedText)) {
      return {
        requiresApproval: true,
        isIrreversible: rule.isIrreversible,
        dangerLevel: rule.dangerLevel,
        actionType: rule.actionType,
        impactDescription: rule.impactDescription,
        reason: rule.reason,
      };
    }
  }

  // Safe by default
  return {
    requiresApproval: false,
    isIrreversible: false,
    dangerLevel: "low",
    actionType: "standard:execution",
    impactDescription: "Standard non-destructive agent subtask.",
    reason: "No high-impact or irreversible operation detected.",
  };
}

/**
 * Creates an immutable ApprovalGateRequest for a mission task.
 */
export function createApprovalRequest(
  missionId: string,
  task: MissionTask,
  detection: ApprovalDetectionResult
): ApprovalGateRequest {
  const id = `appr_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
  return {
    id,
    missionId,
    taskId: task.id,
    taskTitle: task.title,
    actionType: detection.actionType,
    dangerLevel: detection.dangerLevel,
    title: `Approval Required: ${task.title}`,
    description: detection.reason,
    impactDescription: detection.impactDescription,
    isIrreversible: detection.isIrreversible,
    status: "pending",
    requestedAt: Date.now(),
  };
}
