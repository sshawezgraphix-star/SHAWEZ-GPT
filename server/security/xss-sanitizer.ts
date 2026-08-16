/**
 * XSS Protection & HTML Sandbox Sanitizer
 */

export interface SanitizationResult {
  isSafe: boolean;
  sanitizedHtml: string;
  violationsDetected: string[];
}

const DANGEROUS_HTML_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  {
    name: "Inline Script Tag",
    regex: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  },
  {
    name: "JavaScript URI scheme",
    regex: /href\s*=\s*["']?\s*javascript:[^"'>]+/gi,
  },
  {
    name: "DOM Event Handler (onload, onerror, onclick, etc.)",
    regex: /\bon[a-z]{3,20}\s*=\s*["'][^"']*["']/gi,
  },
  {
    name: "Object / Embed / Applet Tag",
    regex: /<\/?(?:object|embed|applet|base)\b[^>]*>/gi,
  },
  {
    name: "Cookie / LocalStorage Access Attempt",
    regex: /(?:document\.cookie|window\.localStorage|window\.sessionStorage)/gi,
  },
];

/**
 * Sanitizes HTML markup by stripping active scripts and dangerous event handlers.
 */
export function sanitizeHtmlMarkup(rawHtml: string): SanitizationResult {
  if (!rawHtml || typeof rawHtml !== "string") {
    return { isSafe: true, sanitizedHtml: "", violationsDetected: [] };
  }

  const violations: string[] = [];
  let sanitized = rawHtml;

  for (const pattern of DANGEROUS_HTML_PATTERNS) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(sanitized)) {
      violations.push(pattern.name);
      pattern.regex.lastIndex = 0;
      sanitized = sanitized.replace(pattern.regex, "<!-- [REMOVED_UNSAFE_CODE] -->");
    }
  }

  return {
    isSafe: violations.length === 0,
    sanitizedHtml: sanitized,
    violationsDetected: violations,
  };
}
