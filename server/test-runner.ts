import { runRegistryTestSuite } from "./registry.test";
import { runMemoryTestSuite } from "./memory.test";
import { runEndToEndTestSuite } from "./e2e.test";
import { runSecurityHardeningAudit } from "./security";
import { runProvidersTestSuite } from "./providers/providers.test";

export async function runAllProductionTestSuites() {
  console.log("\n=======================================================");
  console.log("  SHAWEZGPT COMPLETE REGRESSION, PROVIDER & SECURITY SUITE");
  console.log("=======================================================\n");

  const startTime = Date.now();

  console.log("--- 0. Running Multi-Gemini & Ollama Providers Test Suite (4 tests) ---");
  const provReport = await runProvidersTestSuite();
  console.log(`Results: ${provReport.passed}/${provReport.totalTests} passed (${provReport.durationMs}ms)`);
  for (const r of provReport.results) {
    console.log(`  [${r.passed ? "PASS" : "FAIL"}] ${r.testName} (${r.durationMs}ms)`);
    if (r.error) {
      console.error(`         Error: ${r.error}`);
    }
  }

  console.log("--- 1. Running Agent & Tool Registry Test Suite (7 tests) ---");
  const regReport = await runRegistryTestSuite();
  console.log(`Results: ${regReport.passed}/${regReport.totalTests} passed (${regReport.durationMs}ms)`);
  for (const r of regReport.results) {
    console.log(`  [${r.passed ? "PASS" : "FAIL"}] ${r.testName} (${r.durationMs}ms)`);
    if (r.error) {
      console.error(`         Error: ${r.error}`);
    }
  }

  console.log("\n--- 2. Running Memory & Context Engine Test Suite (7 tests) ---");
  const memReport = await runMemoryTestSuite();
  console.log(`Results: ${memReport.passed}/${memReport.totalTests} passed (${memReport.durationMs}ms)`);
  for (const r of memReport.results) {
    console.log(`  [${r.passed ? "PASS" : "FAIL"}] ${r.testName} (${r.durationMs}ms)`);
    if (r.error) {
      console.error(`         Error: ${r.error}`);
    }
  }

  console.log("\n--- 3. Running 10-Scenario End-to-End Production Test Suite (10 tests) ---");
  const e2eReport = await runEndToEndTestSuite();
  console.log(`Results: ${e2eReport.passed}/${e2eReport.totalScenarios} passed (${e2eReport.durationMs}ms)`);
  for (const sc of e2eReport.scenarios) {
    console.log(`  [${sc.status === "PASSED" ? "PASS" : "FAIL"}] Scenario ${sc.scenarioId}: ${sc.scenarioName} (${sc.durationMs}ms)`);
    if (sc.error) {
      console.error(`         Error: ${sc.error}`);
    }
  }

  console.log("\n--- 4. Running Adversarial Security Hardening Audit Suite ---");
  const secAudit = await runSecurityHardeningAudit();
  console.log(`Results: ${secAudit.passedChecks}/${secAudit.totalChecks} checks passed (${secAudit.fixedVulnerabilities} confirmed & hardened vulnerabilities)`);
  for (const f of secAudit.findings) {
    console.log(`  [${f.severity}] ${f.id} - ${f.title} (${f.adversarialTestResult.passed ? "VERIFIED MITIGATED" : "FAIL"})`);
  }

  const totalCoreTests = regReport.totalTests + memReport.totalTests + e2eReport.totalScenarios;
  const passedCoreTests = regReport.passed + memReport.passed + e2eReport.passed;
  const failedCoreTests = regReport.failed + memReport.failed + e2eReport.failed;
  const totalDuration = Date.now() - startTime;

  console.log("\n=======================================================");
  console.log(`  CORE 24 REGRESSION TESTS: ${passedCoreTests}/${totalCoreTests} PASSED`);
  console.log(`  SECURITY HARDENING AUDIT: ${secAudit.passedChecks}/${secAudit.totalChecks} BOUNDARIES VERIFIED`);
  if (failedCoreTests === 0 && secAudit.passedChecks === secAudit.totalChecks) {
    console.log("  OVERALL STATUS: 100% GREEN, HARDENED & PRODUCTION SECURE 🛡️");
  } else {
    console.log(`  STATUS: ${failedCoreTests} TEST(S) FAILED ❌`);
  }
  console.log("=======================================================\n");

  return {
    registry: regReport,
    memory: memReport,
    e2e: e2eReport,
    security: secAudit,
    totalCoreTests,
    passedCoreTests,
    failedCoreTests,
    totalDuration,
  };
}

if (process.argv[1]?.includes("test-runner") || process.argv[1]?.includes("registry.test")) {
  (async () => {
    const summary = await runAllProductionTestSuites();
    process.exit(summary.failedCoreTests === 0 ? 0 : 1);
  })();
}
