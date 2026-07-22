/**
 * Input sanitization utilities for MIIAM
 * Prevents XSS and injection attacks on user-provided data
 */

/**
 * Remove HTML tags and potentially dangerous characters from a string.
 * Use this on user-provided text that will be displayed in the UI or stored in DB.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>"'&]/g, (char) => { // Escape remaining dangerous chars
      switch (char) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case '"': return "&quot;";
        case "'": return "&#x27;";
        case "&": return "&amp;";
        default: return char;
      }
    })
    .trim();
}

/**
 * Sanitize a string for safe use as a file path component.
 * Removes path traversal sequences and special characters.
 */
export function sanitizeFilePath(input: string): string {
  return input
    .replace(/\.\./g, "") // Remove path traversal
    .replace(/[<>:"|?*]/g, "") // Remove invalid file path chars
    .replace(/\//g, "_") // Replace slashes with underscores
    .replace(/\\/g, "_") // Replace backslashes with underscores
    .trim();
}

/**
 * Validate and sanitize a UUID format.
 * Returns the UUID if valid, null otherwise.
 */
export function sanitizeUuid(input: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const cleaned = input.trim().toLowerCase();
  return uuidRegex.test(cleaned) ? cleaned : null;
}

/**
 * Sanitize a phone number - keep only digits, +, -, spaces, and parentheses.
 */
export function sanitizePhone(input: string): string {
  return input.replace(/[^0-9+\-() ]/g, "").trim();
}

/**
 * Sanitize an email address - lowercase and trim.
 */
export function sanitizeEmail(input: string): string {
  return input.toLowerCase().trim();
}

/**
 * Sanitize a URL - ensure it's a valid http/https URL or return null.
 */
export function sanitizeUrl(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Deep sanitize an object by applying sanitizeText to all string values.
 * Useful for sanitizing API request bodies before storage.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === "string") {
      (sanitized as Record<string, unknown>)[key] = sanitizeText(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    }
  }
  return sanitized;
}
