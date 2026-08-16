/**
 * Tool Security & Privilege Enforcement Guard
 */

import { ToolExecutionContext } from "../registry/types";

export interface ToolSecurityCheck {
  authorized: boolean;
  denialReason?: string;
}

/**
 * Validates that a tool invocation is authorized against required permissions and caller credentials.
 */
export function verifyToolAuthorization(
  toolId: string,
  requiredPermissions: string[],
  context: ToolExecutionContext = {}
): ToolSecurityCheck {
  // If the tool requires NO permissions, access is permitted
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return { authorized: true };
  }

  // If the tool requires permissions, the caller MUST provide valid callerPermissions
  const callerPerms = context.callerPermissions;
  if (!callerPerms || !Array.isArray(callerPerms) || callerPerms.length === 0) {
    return {
      authorized: false,
      denialReason: `Permission Denied: Caller supplied no permissions for restricted tool '${toolId}' (Required: [${requiredPermissions.join(", ")}])`,
    };
  }

  // Check every required permission
  const missing = requiredPermissions.filter((req) => !callerPerms.includes(req));
  if (missing.length > 0) {
    return {
      authorized: false,
      denialReason: `Permission Denied: Caller lacks required permissions [${missing.join(", ")}] for tool '${toolId}'`,
    };
  }

  return { authorized: true };
}

/**
 * Defends against prototype pollution and injection via tool parameters
 */
export function sanitizeToolParameters(params: any): any {
  if (params === null || typeof params !== "object") {
    return params;
  }

  if (Array.isArray(params)) {
    return params.map(sanitizeToolParameters);
  }

  const clean: Record<string, any> = Object.create(null);
  for (const key of Object.keys(params)) {
    // Block prototype pollution properties
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    clean[key] = sanitizeToolParameters((params as any)[key]);
  }

  return clean;
}
