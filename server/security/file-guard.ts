/**
 * File Security Guard: Path Traversal Defense & Malicious Attachment Filtering
 */

import path from "path";

// Disallowed high-risk executable / binary / script extensions
const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".bash",
  ".zsh",
  ".vbs",
  ".vbe",
  ".js.exe",
  ".msi",
  ".com",
  ".scr",
  ".pif",
  ".hta",
  ".cpl",
  ".dll",
  ".sys",
  ".so",
  ".dylib",
  ".ps1",
  ".psm1",
  ".jar",
  ".class",
  ".apk",
  ".bin",
]);

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export interface FileValidationResult {
  safe: boolean;
  sanitizedFilename: string;
  rejectionReason?: string;
  fileSizeBytes?: number;
}

/**
 * Sanitizes a filename to prevent path traversal attacks (e.g. `../../etc/passwd`, null bytes, absolute paths)
 */
export function sanitizeFilename(rawFilename: string): string {
  if (!rawFilename || typeof rawFilename !== "string") {
    return "unnamed_attachment";
  }

  // 1. Remove null bytes
  let clean = rawFilename.replace(/\0/g, "");

  // 2. Extract base name using path.basename to strip directory paths
  clean = path.basename(clean.replace(/\\/g, "/"));

  // 3. Remove traversal characters (e.g. `..`)
  clean = clean.replace(/\.{2,}/g, ".");

  // 4. Strip unsafe non-printable / control characters & path separators
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, "_");

  // 5. Trim leading dots and whitespace
  clean = clean.replace(/^\.+/, "").trim();

  if (!clean || clean === ".") {
    return "safe_attachment";
  }

  return clean.slice(0, 64);
}

/**
 * Validates uploaded attachments against path traversal, executable injection, and file size limits.
 */
export function validateAttachment(attachment: {
  name?: string;
  mimeType?: string;
  size?: number;
  data?: string;
  textContent?: string;
}): FileValidationResult {
  const rawName = attachment.name || "attachment";
  const sanitizedName = sanitizeFilename(rawName);

  // 1. Path traversal check on raw name
  if (
    rawName.includes("../") ||
    rawName.includes("..\\") ||
    rawName.includes("%2e%2e") ||
    rawName.includes("\0")
  ) {
    return {
      safe: false,
      sanitizedFilename: sanitizedName,
      rejectionReason: "Path traversal attempt detected in filename.",
    };
  }

  // 2. Block high-risk executable extensions
  const ext = path.extname(sanitizedName).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return {
      safe: false,
      sanitizedFilename: sanitizedName,
      rejectionReason: `Blocked high-risk file extension '${ext}'. Executables and system scripts are not permitted.`,
    };
  }

  // 3. Check file size limits
  let calculatedSize = attachment.size || 0;
  if (!calculatedSize) {
    if (attachment.data) {
      calculatedSize = Math.round((attachment.data.length * 3) / 4);
    } else if (attachment.textContent) {
      calculatedSize = Buffer.byteLength(attachment.textContent, "utf8");
    }
  }

  if (calculatedSize > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      safe: false,
      sanitizedFilename: sanitizedName,
      rejectionReason: `File size (${Math.round(calculatedSize / 1024)}KB) exceeds maximum security threshold (${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)}MB).`,
      fileSizeBytes: calculatedSize,
    };
  }

  // 4. Check for embedded script injections in SVG or HTML content
  if (attachment.mimeType === "image/svg+xml" || sanitizedName.endsWith(".svg")) {
    const rawContent = attachment.textContent || (attachment.data ? Buffer.from(attachment.data, "base64").toString("utf8") : "");
    if (/<script\b/i.test(rawContent) || /onload\s*=/i.test(rawContent) || /onerror\s*=/i.test(rawContent) || /javascript:/i.test(rawContent)) {
      return {
        safe: false,
        sanitizedFilename: sanitizedName,
        rejectionReason: "SVG file contains embedded JavaScript/event handlers (XSS prevention).",
      };
    }
  }

  return {
    safe: true,
    sanitizedFilename: sanitizedName,
    fileSizeBytes: calculatedSize,
  };
}
