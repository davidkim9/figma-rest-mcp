import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export function createSuccessResponse(data: any): CallToolResult {
  // Defensive: never include raw base64 image data in responses
  const sanitized = (() => {
    try {
      const clone = JSON.parse(JSON.stringify(data));
      const stripBase64 = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        for (const key of Object.keys(obj)) {
          const value = obj[key];
          if (key.toLowerCase() === 'base64') {
            delete obj[key];
            continue;
          }
          if (value && typeof value === 'object') stripBase64(value);
        }
      };
      stripBase64(clone);
      return clone;
    } catch {
      return data;
    }
  })();
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(sanitized)
      }
    ]
  };
}

export function createErrorResponse(error: string | Error): CallToolResult {
  const errorMessage = error instanceof Error ? error.message : error;
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: errorMessage
        })
      }
    ]
  };
}

/**
 * Sanitize text by removing non-printable characters, zero-width chars,
 * collapsing whitespace sequences, converting NBSP to space, and trimming.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  let s = String(input);
  s = s.replace(/\u00A0/g, ' '); // NBSP to regular space
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, ''); // zero-width chars
  s = s.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ''); // control chars
  s = s.replace(/\s+/g, ' '); // collapse whitespace
  s = s.trim();
  return s;
}