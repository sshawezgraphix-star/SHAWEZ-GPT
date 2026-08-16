/**
 * Network Security Guard: SSRF Prevention & Safe URL Inspection
 */

import { URL } from "url";

// Disallowed private / reserved IPv4 & IPv6 patterns
const PRIVATE_IP_RANGES = [
  // Loopback
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^::1$/,
  /^localhost$/i,
  // Link-Local / Cloud Metadata (AWS, GCP, Azure, etc.)
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  /^metadata\.google\.internal$/i,
  /^instance-data$/i,
  // RFC 1918 Private ranges
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  // 0.0.0.0 / Carrier Grade NAT
  /^0\.0\.0\.0$/,
  /^100\.(?:6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/,
  // IPv6 Unique Local & Link Local
  /^[fF][cCdD][0-9a-fA-F]{2}:/,
  /^[fF][eE][89aAbB][0-9a-fA-F]:/,
];

const DISALLOWED_SCHEMES = new Set([
  "file:",
  "gopher:",
  "ftp:",
  "tftp:",
  "ldap:",
  "dict:",
  "javascript:",
  "data:",
  "vbscript:",
]);

export interface UrlValidationResult {
  safe: boolean;
  reason?: string;
  normalizedUrl?: string;
}

/**
 * Validates whether an external URL is safe to fetch or reference, blocking SSRF attempts.
 */
export function validateSafeUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { safe: false, reason: "URL string is empty or invalid" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { safe: false, reason: "Malformed URL syntax" };
  }

  // 1. Enforce HTTP / HTTPS protocol only
  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return {
      safe: false,
      reason: `Disallowed URL protocol '${protocol}'. Only http: and https: are allowed.`,
    };
  }

  if (DISALLOWED_SCHEMES.has(protocol)) {
    return {
      safe: false,
      reason: `Dangerous protocol '${protocol}' blocked by SSRF policy.`,
    };
  }

  // 2. Reject embedded authentication credentials
  if (parsed.username || parsed.password) {
    return {
      safe: false,
      reason: "URLs with embedded credentials (user:pass@host) are rejected.",
    };
  }

  // 3. Inspect hostname against private / internal targets
  const hostname = parsed.hostname.toLowerCase();

  // Strip brackets from IPv6 hostnames
  const normalizedHost = hostname.replace(/^\[|\]$/g, "");

  for (const range of PRIVATE_IP_RANGES) {
    if (range.test(normalizedHost)) {
      return {
        safe: false,
        reason: `Target host '${hostname}' resolves to private/internal/cloud-metadata network (SSRF blocked).`,
      };
    }
  }

  // 4. Block common internal host suffixes (.local, .internal, .lan, .corp)
  if (
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".corp") ||
    hostname.endsWith(".home")
  ) {
    return {
      safe: false,
      reason: `Target internal domain '${hostname}' blocked by SSRF policy.`,
    };
  }

  // 5. Restrict port access to standard web ports (80, 443, 8080, 8443)
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    const ALLOWED_PORTS = [80, 443, 8080, 8443];
    if (!ALLOWED_PORTS.includes(portNum)) {
      return {
        safe: false,
        reason: `Non-standard port :${portNum} is blocked to prevent internal port scanning.`,
      };
    }
  }

  return {
    safe: true,
    normalizedUrl: parsed.toString(),
  };
}
