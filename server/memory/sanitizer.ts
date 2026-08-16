/**
 * Memory Sanitizer: Privacy & Credential Security Enforcement
 * STRICT RULE: Never store passwords, API keys, authentication tokens, connection strings, or sensitive credentials.
 */

export interface CredentialPattern {
  name: string;
  regex: RegExp;
  category: "api_key" | "token" | "private_key" | "password" | "secret";
}

export const CREDENTIAL_PATTERNS: CredentialPattern[] = [
  // Google API Keys
  {
    name: "Google API Key",
    regex: /AIza[0-9A-Za-z_-]{30,45}/g,
    category: "api_key",
  },
  // OpenAI API Keys
  {
    name: "OpenAI Secret Key",
    regex: /sk-[a-zA-Z0-9_-]{20,}/g,
    category: "api_key",
  },
  // Anthropic / Generic API Keys
  {
    name: "Anthropic API Key",
    regex: /sk-ant-[a-zA-Z0-9_-]{20,}/g,
    category: "api_key",
  },
  // GitHub Personal Access Tokens
  {
    name: "GitHub Token",
    regex: /(?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{30,}/g,
    category: "token",
  },
  // Generic Bearer Tokens
  {
    name: "Bearer Token",
    regex: /Bearer\s+[a-zA-Z0-9_\-\.]{25,}/gi,
    category: "token",
  },
  // JWT Tokens (heuristic)
  {
    name: "JSON Web Token (JWT)",
    regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
    category: "token",
  },
  // Private Keys
  {
    name: "RSA / Elliptic Curve Private Key",
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/gi,
    category: "private_key",
  },
  // AWS Access Keys
  {
    name: "AWS Access Key",
    regex: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
    category: "api_key",
  },
  // Passwords in config / code patterns
  {
    name: "Config Password Assignment",
    regex: /(?:password|passwd|pwd|secret_key|client_secret|db_pass)\s*[:=]\s*["']([^"'\s]{6,})["']/gi,
    category: "password",
  },
  // Database Connection Strings with Passwords
  {
    name: "Database URI with Credentials",
    regex: /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis):\/\/[a-zA-Z0-9_]+:[^@\s]+@[a-zA-Z0-9.-]+/gi,
    category: "secret",
  },
  // Stripe Secret Keys
  {
    name: "Stripe Secret Key",
    regex: /(?:sk_live|rk_live|sk_test)_[0-9a-zA-Z]{24,}/g,
    category: "api_key",
  },
  // Slack Tokens
  {
    name: "Slack Token",
    regex: /xox[baprs]-[0-9a-zA-Z]{10,}/g,
    category: "token",
  },
  // GCP Service Account JSON / Private Key ID
  {
    name: "GCP Private Key / Service Account",
    regex: /"private_key_id"\s*:\s*"[a-f0-9]{40}"/gi,
    category: "private_key",
  },
  // Generic Authorization / API Key assignments
  {
    name: "API Key Assignment",
    regex: /(?:api[_-]?key|access[_-]?token|secret[_-]?key)\s*[:=]\s*["']([a-zA-Z0-9_\-\.]{16,})["']/gi,
    category: "api_key",
  },
];

/**
 * Checks if the text contains any detectable credentials or sensitive secrets.
 */
export function containsSensitiveCredentials(text: string): {
  hasSensitive: boolean;
  patternsMatched: string[];
} {
  if (!text) return { hasSensitive: false, patternsMatched: [] };

  const matched: string[] = [];
  for (const pattern of CREDENTIAL_PATTERNS) {
    // Reset regex index
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(text)) {
      matched.push(pattern.name);
    }
  }

  return {
    hasSensitive: matched.length > 0,
    patternsMatched: matched,
  };
}

/**
 * Sanitizes and strips credentials out of any text, replacing them with safe redaction notices.
 */
export function sanitizeCredentials(text: string): {
  sanitizedText: string;
  redactionCount: number;
  redactionDetails: string[];
} {
  if (!text) {
    return { sanitizedText: "", redactionCount: 0, redactionDetails: [] };
  }

  let sanitized = text;
  let redactionCount = 0;
  const redactionDetails: string[] = [];

  for (const pattern of CREDENTIAL_PATTERNS) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(sanitized)) {
      pattern.regex.lastIndex = 0;
      sanitized = sanitized.replace(pattern.regex, (match) => {
        redactionCount++;
        const detail = `Redacted ${pattern.name} (${pattern.category})`;
        if (!redactionDetails.includes(detail)) {
          redactionDetails.push(detail);
        }
        return `[REDACTED_${pattern.category.toUpperCase()}]`;
      });
    }
  }

  return {
    sanitizedText: sanitized,
    redactionCount,
    redactionDetails,
  };
}

/**
 * Full validator for memory entry content and title before writing to storage.
 */
export function validateAndSanitizeMemoryPayload(
  content: string,
  title: string = ""
): {
  safeContent: string;
  safeTitle: string;
  wasRedacted: boolean;
  warnings: string[];
} {
  const contentSanitization = sanitizeCredentials(content);
  const titleSanitization = sanitizeCredentials(title);

  const wasRedacted =
    contentSanitization.redactionCount > 0 ||
    titleSanitization.redactionCount > 0;

  const warnings: string[] = [
    ...contentSanitization.redactionDetails,
    ...titleSanitization.redactionDetails,
  ];

  return {
    safeContent: contentSanitization.sanitizedText.trim(),
    safeTitle: titleSanitization.sanitizedText.trim(),
    wasRedacted,
    warnings,
  };
}
