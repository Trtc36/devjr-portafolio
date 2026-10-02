import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = ["b", "strong", "i", "em", "a", "code", "mark", "u", "s"];
const ALLOWED_ATTR = ["href"];
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i;

export function sanitizeInlineHtml(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
  });
}
