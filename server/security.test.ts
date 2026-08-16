/**
 * Security Hardening & Adversarial Boundary Verification Test Suite
 */

import { runSecurityHardeningAudit } from "./security";

export interface SecurityTestReport {
  totalChecks: number;
  passed: number;
  failed: number;
  status: "SECURE" | "HARDENED";
  durationMs: number;
  findingsCount: number;
}

export async function runSecurityTestSuite(): Promise<SecurityTestReport> {
  const startTime = Date.now();
  const report = await runSecurityHardeningAudit();
  const durationMs = Date.now() - startTime;

  const failed = report.totalChecks - report.passedChecks;

  return {
    totalChecks: report.totalChecks,
    passed: report.passedChecks,
    failed,
    status: report.overallStatus,
    durationMs,
    findingsCount: report.findings.length,
  };
}
