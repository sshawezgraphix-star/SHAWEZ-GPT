import {
  assembleMissionState,
  buildDAGStages,
  createHeuristicMissionPlan,
  detectApprovalRequirement,
  createApprovalRequest,
  MissionExecutor,
  getMissionManager,
} from "./index";
import { getAgentRegistry, getToolRegistry } from "../registry";
import { MissionTestReport } from "../../src/types";

export async function runMissionTestSuite(): Promise<MissionTestReport> {
  const results: Array<{
    testName: string;
    passed: boolean;
    durationMs: number;
    error?: string;
    details?: any;
  }> = [];

  const startTime = Date.now();

  function recordTest(
    name: string,
    passed: boolean,
    duration: number,
    error?: string,
    details?: any
  ) {
    results.push({
      testName: name,
      passed,
      durationMs: duration,
      error,
      details,
    });
  }

  // --- 1. Objective Understanding & Dependency Planning Test ---
  {
    const t0 = Date.now();
    try {
      const objective = "Build a microservices payment API in TypeScript with Stripe SDK and unit tests";
      const mission = createHeuristicMissionPlan("test_mission_1", objective);

      const hasTasks = mission.tasks.length >= 3;
      const hasDAG = mission.dag.stages.length >= 2;
      const hasScope = mission.scope.length > 0;
      const hasDeliverables = mission.targetDeliverables.length > 0;

      if (!hasTasks || !hasDAG || !hasScope || !hasDeliverables) {
        throw new Error(
          `Planning failed: tasks=${mission.tasks.length}, stages=${mission.dag.stages.length}, scope=${mission.scope.length}`
        );
      }

      recordTest("1. Objective Understanding & Dependency Planning", true, Date.now() - t0, undefined, {
        taskCount: mission.tasks.length,
        stages: mission.dag.stages.map((s) => s.name),
      });
    } catch (err: any) {
      recordTest("1. Objective Understanding & Dependency Planning", false, Date.now() - t0, err?.message);
    }
  }

  // --- 2. DAG Wave Dependency Resolution & Topological Ordering ---
  {
    const t0 = Date.now();
    try {
      const rawTasks = [
        { id: "task_1", dependsOn: [] },
        { id: "task_2", dependsOn: ["task_1"] },
        { id: "task_3", dependsOn: ["task_1"] }, // Can run in parallel with task_2!
        { id: "task_4", dependsOn: ["task_2", "task_3"] }, // Depends on both
      ];

      const { stages, taskToStage } = buildDAGStages(rawTasks);

      const stage0 = stages.find((s) => s.stageIndex === 0);
      const stage1 = stages.find((s) => s.stageIndex === 1);
      const stage2 = stages.find((s) => s.stageIndex === 2);

      const validOrder =
        stage0?.taskIds.includes("task_1") &&
        stage1?.taskIds.includes("task_2") &&
        stage1?.taskIds.includes("task_3") &&
        stage1?.isParallel === true &&
        stage2?.taskIds.includes("task_4");

      if (!validOrder) {
        throw new Error(`DAG ordering incorrect: ${JSON.stringify(stages)}`);
      }

      recordTest("2. DAG Wave Dependency Resolution & Topological Ordering", true, Date.now() - t0, undefined, {
        totalStages: stages.length,
        parallelStageTasks: stage1?.taskIds,
      });
    } catch (err: any) {
      recordTest("2. DAG Wave Dependency Resolution & Topological Ordering", false, Date.now() - t0, err?.message);
    }
  }

  // --- 3. Parallel Subtask Execution Wave ---
  {
    const t0 = Date.now();
    try {
      const mission = assembleMissionState(
        "test_parallel_mission",
        "Parallel benchmarking and market analysis",
        "Parallel benchmark execution",
        ["Benchmarking", "Analysis"],
        ["Safe concurrency"],
        ["Benchmark metrics"],
        [
          {
            id: "task_a",
            title: "Market Search Branch A",
            description: "Research top industry benchmarks",
            capability: "research",
            dependsOn: [],
          },
          {
            id: "task_b",
            title: "Data Analysis Branch B",
            description: "Analyze latency curves and performance metrics",
            capability: "data_analysis",
            dependsOn: [],
          },
        ]
      );

      const executor = new MissionExecutor(mission);
      await executor.executeMission();

      const taskA = mission.tasks.find((t) => t.id === "task_a");
      const taskB = mission.tasks.find((t) => t.id === "task_b");

      if (taskA?.status !== "completed" || taskB?.status !== "completed") {
        throw new Error(`Parallel execution failed: A=${taskA?.status}, B=${taskB?.status}`);
      }

      recordTest("3. Parallel Subtask Execution Wave", true, Date.now() - t0, undefined, {
        stage0Parallel: mission.dag.stages[0]?.isParallel,
        completedTasks: mission.completedTaskCount,
      });
    } catch (err: any) {
      recordTest("3. Parallel Subtask Execution Wave", false, Date.now() - t0, err?.message);
    }
  }

  // --- 4. Failure Recovery & Fallback Agent Selection ---
  {
    const t0 = Date.now();
    try {
      const agentRegistry = getAgentRegistry();

      // Temporarily mark a specialized agent as degraded
      const originalStatus = agentRegistry.getAgent("code-architect-agent")?.status || "active";
      agentRegistry.updateAgentStatus("code-architect-agent", "degraded");

      const mission = assembleMissionState(
        "test_recovery_mission",
        "Fix critical bug in payment validator",
        "Bugfix with degraded agent simulation",
        ["Bugfix"],
        ["Fallback recovery"],
        ["Patched code"],
        [
          {
            id: "task_code_fix",
            title: "Fix Payment Logic",
            description: "Correct calculation of transaction fee",
            capability: "coding",
            dependsOn: [],
          },
        ]
      );

      const executor = new MissionExecutor(mission);
      await executor.executeMission();

      // Restore status
      agentRegistry.updateAgentStatus("code-architect-agent", originalStatus);

      const task = mission.tasks[0];
      if (task.status !== "completed" || !task.fallbackAgentId) {
        throw new Error(`Recovery failed: status=${task.status}, fallbackId=${task.fallbackAgentId}`);
      }

      recordTest("4. Failure Recovery & Fallback Agent Selection", true, Date.now() - t0, undefined, {
        assignedAgent: task.assignedAgentId,
        fallbackAgent: task.fallbackAgentName,
        verified: task.verificationResult?.verified,
      });
    } catch (err: any) {
      recordTest("4. Failure Recovery & Fallback Agent Selection", false, Date.now() - t0, err?.message);
    }
  }

  // --- 5. Approval Gates for Irreversible Actions ---
  {
    const t0 = Date.now();
    try {
      // 5a. Detect irreversible action
      const deleteDetection = detectApprovalRequirement({
        title: "Wipe staging database partitions",
        description: "Permanently delete customer staging records and truncate table",
        capability: "coding",
      });

      if (!deleteDetection.requiresApproval || !deleteDetection.isIrreversible || deleteDetection.dangerLevel !== "critical") {
        throw new Error(`Approval detection failed for permanent delete: ${JSON.stringify(deleteDetection)}`);
      }

      // 5b. Verify execution holds at approval gate until approved
      const mission = assembleMissionState(
        "test_approval_mission",
        "Deploy and purge legacy records",
        "Irreversible action gate test",
        ["Data management"],
        ["Operator approval required"],
        ["Clean state"],
        [
          {
            id: "task_destroy",
            title: "Purge Database Records",
            description: "Permanently delete all deprecated backup archives",
            capability: "coding",
            dependsOn: [],
          },
        ]
      );

      const executor = new MissionExecutor(mission);

      // Launch in background
      const executionPromise = executor.executeMission();

      // Wait 100ms for it to reach the approval gate
      await new Promise((r) => setTimeout(r, 100));

      const task = mission.tasks[0];
      if (task.status !== "awaiting_approval" || mission.controlState !== "awaiting_approval") {
        throw new Error(`Task did not halt at approval gate: status=${task.status}, controlState=${mission.controlState}`);
      }

      // Approve action
      const approvalId = mission.pendingApprovals[0]?.id;
      if (!approvalId) throw new Error("Approval request was not registered in pendingApprovals");

      executor.approveAction(approvalId, "Operator approved sandbox purge");

      await executionPromise;

      const completedTask = mission.tasks.find((t) => t.id === "task_destroy");
      if (completedTask?.status !== "completed") {
        throw new Error(`Task did not complete after approval: status=${completedTask?.status}`);
      }

      recordTest("5. Approval Gates for Irreversible Actions", true, Date.now() - t0, undefined, {
        dangerLevel: deleteDetection.dangerLevel,
        gateHaltedProperly: true,
        resolvedAfterApproval: true,
      });
    } catch (err: any) {
      recordTest("5. Approval Gates for Irreversible Actions", false, Date.now() - t0, err?.message);
    }
  }

  // --- 6. Pause, Resume & Cancel Controls ---
  {
    const t0 = Date.now();
    try {
      const mission = assembleMissionState(
        "test_controls_mission",
        "Multi-stage pipeline control test",
        "Control state management",
        ["Controls"],
        ["Deterministic pause and resume"],
        ["Deliverable"],
        [
          {
            id: "task_1",
            title: "Stage 1 Task",
            description: "Analyze requirements",
            capability: "research",
            dependsOn: [],
          },
          {
            id: "task_2",
            title: "Stage 2 Task",
            description: "Draft deliverable",
            capability: "writing",
            dependsOn: ["task_1"],
          },
        ]
      );

      const executor = new MissionExecutor(mission);

      // Pause immediately
      executor.pause();
      if ((mission.controlState as string) !== "paused" || (mission.phase as string) !== "paused") {
        throw new Error(`Pause state failed: phase=${mission.phase}, controlState=${mission.controlState}`);
      }

      // Resume
      executor.resume();
      if ((mission.controlState as string) !== "running") {
        throw new Error(`Resume state failed: controlState=${mission.controlState}`);
      }

      // Cancel
      executor.cancel();
      if ((mission.controlState as string) !== "cancelled" || (mission.phase as string) !== "cancelled") {
        throw new Error(`Cancel state failed: phase=${mission.phase}, controlState=${mission.controlState}`);
      }

      recordTest("6. Pause, Resume & Cancel Controls", true, Date.now() - t0, undefined, {
        pausedStateVerified: true,
        resumedStateVerified: true,
        cancelledStateVerified: true,
      });
    } catch (err: any) {
      recordTest("6. Pause, Resume & Cancel Controls", false, Date.now() - t0, err?.message);
    }
  }

  // --- 7. Result Verification & Quality Scoring ---
  {
    const t0 = Date.now();
    try {
      const mission = assembleMissionState(
        "test_verify_mission",
        "Create TypeScript utility library",
        "Verified library creation",
        ["Utility Library"],
        ["Type check"],
        ["Code artifact"],
        [
          {
            id: "task_code",
            title: "Generate Math Utilities",
            description: "Write TypeScript functions for vector math and statistics",
            capability: "coding",
            dependsOn: [],
          },
        ]
      );

      const executor = new MissionExecutor(mission);
      await executor.executeMission();

      const task = mission.tasks[0];
      const verification = task.verificationResult;

      if (!verification || !verification.verified || verification.checksPassed.length === 0) {
        throw new Error(`Task verification failed: ${JSON.stringify(verification)}`);
      }

      if (!mission.verificationOverall || !mission.verificationOverall.verified || mission.verificationOverall.score < 90) {
        throw new Error(`Overall mission verification failed: ${JSON.stringify(mission.verificationOverall)}`);
      }

      recordTest("7. Result Verification & Quality Scoring", true, Date.now() - t0, undefined, {
        overallScore: mission.verificationOverall.score,
        checksPassed: verification.checksPassed,
      });
    } catch (err: any) {
      recordTest("7. Result Verification & Quality Scoring", false, Date.now() - t0, err?.message);
    }
  }

  // --- 8. Final Deliverable & Artifact Delivery ---
  {
    const t0 = Date.now();
    try {
      const mission = assembleMissionState(
        "test_artifact_mission",
        "Generate comprehensive PDF report on cloud architecture",
        "Research and PDF compilation",
        ["Research", "PDF Generation"],
        ["Publication quality"],
        ["Executive PDF"],
        [
          {
            id: "task_pdf_gen",
            title: "Compile Cloud Architecture Report PDF",
            description: "Generate structured PDF report with diagrams and executive summary",
            capability: "pdf_doc_generation",
            dependsOn: [],
          },
        ]
      );

      const executor = new MissionExecutor(mission);
      await executor.executeMission();

      const hasArtifact = mission.artifacts.some(
        (a) =>
          (a.type as string) === "pdf" ||
          (a.type as string) === "report" ||
          (a.type as string) === "markdown" ||
          (a.type as string) === "code" ||
          (a.type as string) === "code_file"
      );
      const hasSynthesis = typeof mission.finalSynthesis === "string" && mission.finalSynthesis.length > 50;

      if (!hasArtifact || !hasSynthesis) {
        throw new Error(`Artifact delivery failed: artifacts=${mission.artifacts.length}, synthesisLen=${mission.finalSynthesis?.length}`);
      }

      recordTest("8. Final Deliverable & Artifact Delivery", true, Date.now() - t0, undefined, {
        artifactCount: mission.artifacts.length,
        artifactTypes: mission.artifacts.map((a) => a.type),
        synthesisLength: mission.finalSynthesis?.length,
      });
    } catch (err: any) {
      recordTest("8. Final Deliverable & Artifact Delivery", false, Date.now() - t0, err?.message);
    }
  }

  const durationMs = Date.now() - startTime;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    suiteName: "ShawezGPT Mission Mode 8-Stage Autonomous Suite",
    totalTests: results.length,
    passed,
    failed,
    durationMs,
    results,
  };
}
