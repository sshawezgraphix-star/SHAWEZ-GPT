/**
 * ShawezGPT Security Architecture Types & Audit Interfaces
 */

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "PASS";

export interface SecurityVulnerabilityFinding {
  id: string;
  category: SecurityCategory;
  title: string;
  severity: SeverityLevel;
  description: string;
  remediation: string;
  status: "confirmed_and_fixed" | "mitigated" | "verified_secure";
  adversarialTestResult: {
    passed: boolean;
    testPayload: string;
    details: string;
  };
}

export type SecurityCategory =
  | "prompt_injection"
  | "agent_permission_escalation"
  | "tool_authorization"
  | "memory_isolation"
  | "project_isolation"
  | "file_access_boundaries"
  | "api_key_exposure"
  | "ssrf_protection"
  | "xss_protection"
  | "code_execution_sandboxing"
  | "path_traversal"
  | "rate_limiting"
  | "auth_session_security"
  | "malicious_file_handling"
  | "untrusted_web_content";

export interface SecurityAuditReport {
  timestamp: string;
  auditVersion: string;
  overallStatus: "SECURE" | "HARDENED";
  totalChecks: number;
  passedChecks: number;
  fixedVulnerabilities: number;
  findings: SecurityVulnerabilityFinding[];
  summaryByCategory: Record<
    SecurityCategory,
    {
      status: SeverityLevel;
      checksCount: number;
      findingsCount: number;
      summary: string;
    }
  >;
}
