export * from "../../src/types";

export interface MissionEventPayload {
  missionId: string;
  type:
    | "phase_changed"
    | "dag_created"
    | "stage_started"
    | "task_started"
    | "task_progress"
    | "task_verifying"
    | "task_completed"
    | "task_failed"
    | "task_recovering"
    | "task_retried"
    | "approval_required"
    | "approval_resolved"
    | "mission_paused"
    | "mission_resumed"
    | "mission_cancelled"
    | "mission_completed"
    | "mission_failed"
    | "artifact_created"
    | "synthesis_ready";
  timestamp: number;
  missionState: any;
  message?: string;
  task?: any;
  approval?: any;
  artifact?: any;
  details?: any;
}
